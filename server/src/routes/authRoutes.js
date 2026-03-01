import { Router } from "express";
import { body } from "express-validator";

import {
  register,
  verifyEmail,
  resendVerification,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  googleAuth,
  googleCallback,
  getMe,
  updateProfile,
  deleteAccount,
} from "../controllers/authController.js";

import { protect } from "../middleware/verifyToken.js";
import { validate } from "../middleware/validate.js";

const router = Router();

// ── Validation rules ──────────────────────────────────────────────────────────
const registerRules = [
  body("email").isEmail().normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username: 3–30 chars, letters/numbers/underscores only"),
];

const loginRules = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
];

const codeRules = [
  body("email").isEmail().normalizeEmail(),
  body("code")
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Invalid code"),
];

const resetRules = [
  body("email").isEmail().normalizeEmail(),
  body("code").isLength({ min: 6, max: 6 }).isNumeric(),
  body("newPassword").isLength({ min: 8 }),
];

// ── Public ────────────────────────────────────────────────────────────────────
router.post("/register", registerRules, validate, register);
router.post("/verify-email", codeRules, validate, verifyEmail);
router.post(
  "/resend-verification",
  body("email").isEmail(),
  validate,
  resendVerification,
);
router.post("/login", loginRules, validate, login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.post(
  "/forgot-password",
  body("email").isEmail(),
  validate,
  forgotPassword,
);
router.post("/reset-password", resetRules, validate, resetPassword);

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

// ── Protected ─────────────────────────────────────────────────────────────────
router.get("/me", protect, getMe);
router.patch("/me", protect, updateProfile);
router.delete("/me", protect, deleteAccount);

export default router;
