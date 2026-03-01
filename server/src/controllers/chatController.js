import User from "../models/User.js";
import Chat from "../models/Chat.js";
import ChatSummary from "../models/ChatSummary.js";
import { sendMessage } from "../services/geminiService.js";
import {
  summarizeAndStoreSession,
  retrieveRelevantContext,
  formatContextBlock,
} from "../services/ragService.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const HISTORY_WINDOW = 20;

const getRecentMood = (user) => {
  if (!user.moodHistory?.length) return null;
  const latest = user.moodHistory[user.moodHistory.length - 1];
  return {
    score: latest.score,
    label: latest.label,
    detectedVia: latest.detectedVia,
    recordedAt: latest.createdAt,
  };
};

const getActiveSession = (userId) =>
  Chat.findOne({ userId, isActive: true }).sort({ createdAt: -1 });

// ─────────────────────────────────────────────────────────────────────────────
//  1. START PLAIN NEW SESSION (manual)
// ─────────────────────────────────────────────────────────────────────────────
export const startSession = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const moodContext = getRecentMood(user);

  const session = await Chat.create({
    userId: user._id,
    moodContext,
    messages: [],
    title: "New Session",
    isActive: true,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { sessionId: session._id, moodContext },
        "Chat session created.",
      ),
    );
});

// ─────────────────────────────────────────────────────────────────────────────
//  2. NEW MOOD DETECTED → Archive old session → Start new one
//
//  Called by your TensorFlow face-detection frontend whenever a new emotion scan
//  completes and has already been saved to user.moodHistory in the DB.
//
//  Flow:
//    a) Find current active session
//    b) Summarize it with Gemini → store in ChatSummary (RAG doc)
//    c) Mark old session inactive
//    d) Create new session with the latest mood
// ─────────────────────────────────────────────────────────────────────────────
export const onNewMoodDetected = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  // Step A: summarize and archive the active session
  const activeSession = await getActiveSession(user._id);
  let summary = null;

  if (activeSession) {
    try {
      summary = await summarizeAndStoreSession(activeSession);
    } catch (err) {
      console.error("[RAG] Summarization failed:", err.message);
      // Non-fatal — still proceed
    }
    await Chat.findByIdAndUpdate(activeSession._id, { isActive: false });
  }

  // Step B: create fresh session with latest mood
  const newMoodContext = getRecentMood(user);

  const newSession = await Chat.create({
    userId: user._id,
    moodContext: newMoodContext,
    messages: [],
    title: "New Session",
    isActive: true,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        sessionId: newSession._id,
        newMoodContext,
        previousSessionSummarized: !!summary,
        previousSessionId: activeSession?._id || null,
      },
      "New mood detected. Previous session saved. New session started.",
    ),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
//  3. SEND MESSAGE
//  Every message triggers RAG retrieval → injects past context into Gemini
// ─────────────────────────────────────────────────────────────────────────────
export const sendChat = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { message } = req.body;

  if (!message?.trim()) throw new ApiError(400, "Message cannot be empty.");

  const session = await Chat.findById(sessionId);
  if (!session) throw new ApiError(404, "Chat session not found.");
  if (session.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied.");
  }

  // RAG: retrieve relevant past summaries
  let ragContextBlock = null;
  try {
    const relevantSummaries = await retrieveRelevantContext(
      req.user._id,
      message.trim(),
      session.moodContext?.label,
    );
    ragContextBlock = formatContextBlock(relevantSummaries);
  } catch (err) {
    console.error("[RAG] Retrieval failed:", err.message);
  }

  const historyWindow = session.messages.slice(-HISTORY_WINDOW);

  let aiReply;
  try {
    aiReply = await sendMessage(
      message.trim(),
      historyWindow,
      session.moodContext,
      ragContextBlock,
    );
  } catch (err) {
    console.error("Gemini error:", err.message);
    throw new ApiError(502, "AI service unavailable. Please try again.");
  }

  if (session.messages.length === 0) {
    session.title =
      message.trim().slice(0, 60) + (message.length > 60 ? "..." : "");
  }

  session.messages.push(
    { role: "user", content: message.trim() },
    { role: "model", content: aiReply },
  );
  await session.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        sessionId: session._id,
        userMessage: message.trim(),
        aiReply,
        usedPastContext: !!ragContextBlock,
        totalMessages: session.messages.length,
      },
      "Message sent.",
    ),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
//  4. GET ALL SESSIONS
// ─────────────────────────────────────────────────────────────────────────────
export const getSessions = asyncHandler(async (req, res) => {
  const sessions = await Chat.find({ userId: req.user._id })
    .select("title moodContext isActive createdAt updatedAt messages")
    .sort({ updatedAt: -1 })
    .lean();

  const sessionList = sessions.map((s) => ({
    sessionId: s._id,
    title: s.title,
    moodContext: s.moodContext,
    isActive: s.isActive,
    messageCount: s.messages.length,
    lastActivity: s.updatedAt,
    createdAt: s.createdAt,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, sessionList, "Sessions fetched."));
});

// ─────────────────────────────────────────────────────────────────────────────
//  5. GET SINGLE SESSION WITH MESSAGES
// ─────────────────────────────────────────────────────────────────────────────
export const getSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await Chat.findById(sessionId).lean();
  if (!session) throw new ApiError(404, "Session not found.");
  if (session.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied.");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        sessionId: session._id,
        title: session.title,
        moodContext: session.moodContext,
        isActive: session.isActive,
        messages: session.messages,
        createdAt: session.createdAt,
      },
      "Session fetched.",
    ),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
//  6. GET RAG SUMMARIES (past session summaries used for retrieval)
// ─────────────────────────────────────────────────────────────────────────────
export const getSummaries = asyncHandler(async (req, res) => {
  const summaries = await ChatSummary.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .select("-__v")
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, summaries, "Summaries fetched."));
});

// ─────────────────────────────────────────────────────────────────────────────
//  7. DELETE SESSION
// ─────────────────────────────────────────────────────────────────────────────
export const deleteSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await Chat.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found.");
  if (session.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied.");
  }

  await session.deleteOne();
  return res.status(200).json(new ApiResponse(200, null, "Session deleted."));
});

// ─────────────────────────────────────────────────────────────────────────────
//  8. CLEAR MESSAGES (keep session)
// ─────────────────────────────────────────────────────────────────────────────
export const clearHistory = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await Chat.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found.");
  if (session.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied.");
  }

  session.messages = [];
  await session.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Chat history cleared."));
});
