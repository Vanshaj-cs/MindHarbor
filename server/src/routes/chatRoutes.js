import { Router } from "express";
import { body, param } from "express-validator";

import {
  startSession,
  onNewMoodDetected,
  sendChat,
  getSessions,
  getSession,
  getSummaries,
  deleteSession,
  clearHistory,
} from "../controllers/chatController.js";

import { protect } from "../middleware/verifyToken.js";
import { validate } from "../middleware/validate.js";

const router = Router();

// All chat routes require authentication
router.use(protect);

const sessionIdRule = param("sessionId")
  .isMongoId()
  .withMessage("Invalid session ID");

// ── Sessions ──────────────────────────────────────────────────────────────────

// POST /api/chat/sessions             → start a fresh session manually
router.post("/sessions", startSession);

// POST /api/chat/sessions/new-mood    → called after TensorFlow face scan
//   Summarizes old session → stores RAG doc → starts new session with new mood
router.post("/sessions/new-mood", onNewMoodDetected);

// GET  /api/chat/sessions             → list all sessions
router.get("/sessions", getSessions);

// GET  /api/chat/sessions/:id         → full session with message history
router.get("/sessions/:sessionId", sessionIdRule, validate, getSession);

// DELETE /api/chat/sessions/:id       → delete session
router.delete("/sessions/:sessionId", sessionIdRule, validate, deleteSession);

// DELETE /api/chat/sessions/:id/history → clear messages, keep session
router.delete(
  "/sessions/:sessionId/history",
  sessionIdRule,
  validate,
  clearHistory,
);

// ── Messaging ─────────────────────────────────────────────────────────────────

// POST /api/chat/sessions/:id/message → send message, get Gemini reply (with RAG)
router.post(
  "/sessions/:sessionId/message",
  sessionIdRule,
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ max: 2000 })
    .withMessage("Message too long (max 2000 chars)"),
  validate,
  sendChat,
);

// ── RAG Summaries ─────────────────────────────────────────────────────────────

// GET /api/chat/summaries → view all stored past session summaries (RAG docs)
router.get("/summaries", getSummaries);

export default router;
