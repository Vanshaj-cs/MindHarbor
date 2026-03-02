import Chat from "../models/Chat.js";
import { analyzeSessionMessages } from "../services/nlpService.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ─────────────────────────────────────────────────────────────────────────────
// 1. END SESSION → NLP analyze → store scores
// ─────────────────────────────────────────────────────────────────────────────
export const endSessionAndAnalyze = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await Chat.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found.");
  if (session.userId.toString() !== req.user._id.toString())
    throw new ApiError(403, "Access denied.");
  if (!session.isActive) throw new ApiError(400, "Session already ended.");

  const userMessages = session.messages.filter((m) => m.role === "user");
  if (!userMessages.length) throw new ApiError(400, "No messages to analyze.");

  let nlpResult = null;
  try {
    nlpResult = await analyzeSessionMessages(req.user._id, userMessages);
  } catch (err) {
    console.error("NLP error:", err.message);
  }

  session.isActive = false;
  session.mentalScore = nlpResult?.mental_score ?? null;
  session.dominantEmotion = nlpResult?.dominant_emotion ?? null;
  session.emotionConfidence = nlpResult?.confidence ?? null;
  session.distressStatus = nlpResult?.status ?? null;
  await session.save();

  const isCrisis = nlpResult?.status?.toLowerCase().includes("high distress");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        sessionId: session._id,
        mentalScore: session.mentalScore,
        dominantEmotion: session.dominantEmotion,
        confidence: session.emotionConfidence,
        status: session.distressStatus,
        isCrisis, // frontend can show crisis alert if true
      },
      "Session ended and analyzed.",
    ),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET ANALYTICS → average scores across sessions (no Gemini)
// ─────────────────────────────────────────────────────────────────────────────
export const getAnalytics = asyncHandler(async (req, res) => {
  const sessions = await Chat.find({
    userId: req.user._id,
    isActive: false,
    mentalScore: { $ne: null },
  })
    .select(
      "title mentalScore dominantEmotion emotionConfidence distressStatus createdAt",
    )
    .sort({ createdAt: 1 })
    .lean();

  if (!sessions.length) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          sessions: [],
          averageScore: null,
          firstScore: null,
          lastScore: null,
          improvement: null,
          trend: "neutral",
          distressSessions: 0,
          emotionCounts: {},
        },
        "Analytics fetched.",
      ),
    );
  }

  const scores = sessions.map((s) => s.mentalScore);
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const firstScore = scores[0];
  const lastScore = scores[scores.length - 1];
  const improvement = lastScore - firstScore;
  const trend =
    improvement > 0.3
      ? "improving"
      : improvement < -0.3
        ? "declining"
        : "stable";

  // Emotion frequency count
  const emotionCounts = {};
  sessions.forEach((s) => {
    if (s.dominantEmotion) {
      emotionCounts[s.dominantEmotion] =
        (emotionCounts[s.dominantEmotion] || 0) + 1;
    }
  });

  // High distress session count
  const distressSessions = sessions.filter((s) =>
    s.distressStatus?.toLowerCase().includes("high distress"),
  ).length;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        sessions: sessions.map((s) => ({
          sessionId: s._id,
          title: s.title,
          mentalScore: s.mentalScore,
          dominantEmotion: s.dominantEmotion,
          confidence: s.emotionConfidence,
          status: s.distressStatus,
          date: s.createdAt,
        })),
        averageScore: parseFloat(averageScore.toFixed(2)),
        firstScore: parseFloat(firstScore.toFixed(2)),
        lastScore: parseFloat(lastScore.toFixed(2)),
        improvement: parseFloat(improvement.toFixed(2)),
        trend,
        distressSessions,
        emotionCounts,
      },
      "Analytics fetched.",
    ),
  );
});
