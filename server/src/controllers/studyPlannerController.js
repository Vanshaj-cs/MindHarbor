import StudyPlan from "../models/StudyPlan.js";
import GoogleToken from "../models/GoogleToken.js";
import { generateStudyPlan } from "../services/studyPlannerService.js";
import {
  uploadImageBuffer,
  deleteImage,
} from "../services/cloudinaryService.js";
import {
  getAuthUrl,
  exchangeCodeAndSave,
  insertCalendarEvents,
  deleteCalendarEvents,
} from "../services/googleCalendarService.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/planner/generate-plan
//
//  Accepts multipart/form-data with:
//    - syllabusText     (string, optional if image provided)
//    - syllabusImage    (file,   optional if text provided)
//    - totalDays        (number)
//    - hoursPerDay      (number)
//    - startDate        (YYYY-MM-DD)
//
//  Flow:
//    1. If image uploaded → push buffer to Cloudinary → get URL
//    2. Pass URL to studyPlannerService → service fetches base64 → sends to Gemini
//    3. Gemini reads image + text → returns structured plan JSON
// ─────────────────────────────────────────────────────────────────────────────
export const generatePlan = asyncHandler(async (req, res) => {
  const { syllabusText, totalDays, hoursPerDay, startDate } = req.body;

  // Must provide at least one of text or image
  if (!syllabusText?.trim() && !req.file) {
    throw new ApiError(
      400,
      "Provide syllabusText, a syllabusImage file, or both.",
    );
  }
  if (!totalDays) throw new ApiError(400, "totalDays is required.");
  if (!hoursPerDay) throw new ApiError(400, "hoursPerDay is required.");
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    throw new ApiError(400, "startDate must be YYYY-MM-DD.");
  }

  // ── Step 1: Upload image to Cloudinary if provided ────────────────────────
  let syllabusImageUrl = null;
  let cloudinaryPublicId = null;

  if (req.file) {
    try {
      const uploaded = await uploadImageBuffer(
        req.file.buffer,
        req.file.mimetype,
      );
      syllabusImageUrl = uploaded.url;
      cloudinaryPublicId = uploaded.publicId;
    } catch (err) {
      throw new ApiError(500, `Image upload failed: ${err.message}`);
    }
  }

  // ── Step 2: Generate plan (Gemini reads image + text) ─────────────────────
  let studyPlan, flowchartMermaid, calendarEvents;
  try {
    ({ studyPlan, flowchartMermaid, calendarEvents } = await generateStudyPlan({
      syllabusText: syllabusText?.trim() || "",
      syllabusImageUrl, // Cloudinary URL → service fetches as base64 for Gemini
      totalDays: Number(totalDays),
      hoursPerDay: Number(hoursPerDay),
      startDate,
    }));
  } catch (err) {
    // Clean up Cloudinary upload if Gemini fails
    if (cloudinaryPublicId) {
      await deleteImage(cloudinaryPublicId).catch(() => {});
    }
    throw new ApiError(502, `Plan generation failed: ${err.message}`);
  }

  // ── Step 3: Persist in MongoDB ────────────────────────────────────────────
  const plan = await StudyPlan.create({
    userId: req.user._id,
    syllabusText: syllabusText?.trim() ?? "",
    syllabusImage: syllabusImageUrl,
    totalDays: Number(totalDays),
    hoursPerDay: Number(hoursPerDay),
    startDate,
    studyPlan,
    flowchartMermaid,
    calendarEvents,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        planId: plan._id,
        syllabusImageUrl,
        studyPlan,
        flowchartMermaid,
        calendarEvents,
        totalEvents: calendarEvents.length,
      },
      "Study plan generated successfully.",
    ),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/planner/auth/google
// ─────────────────────────────────────────────────────────────────────────────
export const googleAuthRedirect = asyncHandler(async (req, res) => {
  const state = Buffer.from(
    JSON.stringify({ userId: req.user._id.toString() }),
  ).toString("base64");
  const authUrl = getAuthUrl() + `&state=${encodeURIComponent(state)}`;
  res.redirect(authUrl);
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/planner/auth/google/callback
// ─────────────────────────────────────────────────────────────────────────────
export const googleAuthCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;

  if (error) throw new ApiError(400, `Google OAuth denied: ${error}`);
  if (!code) throw new ApiError(400, "Authorization code missing.");
  if (!state) throw new ApiError(400, "State parameter missing.");

  let userId;
  try {
    const decoded = JSON.parse(
      Buffer.from(decodeURIComponent(state), "base64").toString(),
    );
    userId = decoded.userId;
  } catch {
    throw new ApiError(400, "Invalid state parameter.");
  }

  await exchangeCodeAndSave(code, userId);
  return res.redirect(`${process.env.CLIENT_URL}/planner?googleConnected=true`);
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/planner/calendar/sync
// ─────────────────────────────────────────────────────────────────────────────
export const syncToCalendar = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  if (!planId) throw new ApiError(400, "planId is required.");

  const plan = await StudyPlan.findById(planId);
  if (!plan) throw new ApiError(404, "Study plan not found.");
  if (plan.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied.");
  }

  const tokenDoc = await GoogleToken.findOne({ userId: req.user._id });
  if (!tokenDoc) {
    throw new ApiError(
      401,
      "Google Calendar not connected. Visit /api/planner/auth/google first.",
    );
  }

  if (plan.syncedToCalendar && plan.calendarEventIds?.length) {
    await deleteCalendarEvents(req.user._id, plan.calendarEventIds);
  }

  const { inserted, failed } = await insertCalendarEvents(
    req.user._id,
    plan.calendarEvents,
  );
  const eventIds = inserted.map((e) => e.eventId);

  await StudyPlan.findByIdAndUpdate(planId, {
    syncedToCalendar: true,
    calendarEventIds: eventIds,
    syncedAt: new Date(),
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        planId,
        insertedCount: inserted.length,
        failedCount: failed.length,
        inserted,
        failed,
        calendarLink: "https://calendar.google.com/calendar/r",
      },
      `Synced ${inserted.length} events to Google Calendar.`,
    ),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/planner/plans
// ─────────────────────────────────────────────────────────────────────────────
export const getPlans = asyncHandler(async (req, res) => {
  const plans = await StudyPlan.find({ userId: req.user._id })
    .select(
      "studyPlan.title totalDays hoursPerDay startDate syllabusImage syncedToCalendar syncedAt createdAt",
    )
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, plans, "Plans fetched."));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/planner/plans/:planId
// ─────────────────────────────────────────────────────────────────────────────
export const getPlan = asyncHandler(async (req, res) => {
  const plan = await StudyPlan.findById(req.params.planId).lean();
  if (!plan) throw new ApiError(404, "Plan not found.");
  if (plan.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied.");
  }

  return res.status(200).json(new ApiResponse(200, plan, "Plan fetched."));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/planner/google/status
// ─────────────────────────────────────────────────────────────────────────────
export const googleStatus = asyncHandler(async (req, res) => {
  const tokenDoc = await GoogleToken.findOne({ userId: req.user._id });
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        connected: !!tokenDoc,
        connectedAt: tokenDoc?.createdAt || null,
      },
      "Google Calendar status.",
    ),
  );
});
