import { Router } from "express";
import { body, param } from "express-validator";

import {
  generatePlan,
  googleAuthRedirect,
  googleAuthCallback,
  syncToCalendar,
  getPlans,
  getPlan,
  googleStatus,
} from "../controllers/studyPlannerController.js";

import { protect } from "../middleware/verifyToken.js";
import { validate } from "../middleware/validate.js";
import {
  uploadSyllabusImage,
  handleUploadError,
} from "../middleware/uploadMiddleware.js";

const router = Router();

// ── Generate Plan ─────────────────────────────────────────────────────────────
// POST /api/planner/generate-plan
// Content-Type: multipart/form-data
// Fields:
//   syllabusImage  (file)   — image/pdf of your syllabus (optional if syllabusText given)
//   syllabusText   (string) — raw syllabus text          (optional if image given)
//   totalDays      (number)
//   hoursPerDay    (number)
//   startDate      (YYYY-MM-DD)
router.post(
  "/generate-plan",
  protect,
  uploadSyllabusImage, // multer: parse multipart, put file in req.file
  handleUploadError, // convert multer errors → ApiError
  [
    body("totalDays")
      .isInt({ min: 1, max: 365 })
      .withMessage("totalDays must be between 1 and 365"),
    body("hoursPerDay")
      .isFloat({ min: 0.5, max: 16 })
      .withMessage("hoursPerDay must be between 0.5 and 16"),
    body("startDate")
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("startDate must be YYYY-MM-DD"),
  ],
  validate,
  generatePlan,
);

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get("/auth/google", protect, googleAuthRedirect);
router.get("/auth/google/callback", googleAuthCallback); // no protect — no cookie yet
router.get("/google/status", protect, googleStatus);

// ── Calendar Sync ─────────────────────────────────────────────────────────────
router.post(
  "/calendar/sync",
  protect,
  body("planId").isMongoId().withMessage("Invalid planId"),
  validate,
  syncToCalendar,
);

// ── Plan CRUD ─────────────────────────────────────────────────────────────────
router.get("/plans", protect, getPlans);
router.get(
  "/plans/:planId",
  protect,
  param("planId").isMongoId().withMessage("Invalid planId"),
  validate,
  getPlan,
);

export default router;
