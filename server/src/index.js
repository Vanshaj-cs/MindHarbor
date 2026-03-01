import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import session from "express-session";

import connectDB from "./config/database.js";
import { initOidcClient } from "./config/cognito.js";
import authRoutes from "./routes/authRoutes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

// ── Session (required for storing nonce + state during Google OAuth) ──────────
// nonce/state are short-lived values that only exist between /google and /google/callback
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 5 * 60 * 1000 }, // 5 min – just enough for OAuth flow
  }),
);

// ── General Middleware ────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({
    success: false,
    message: "Route not found.",
    errors: ["NOT_FOUND"],
  }),
);

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Bootstrap: connect DB + init OIDC, then start server ─────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await initOidcClient(); // discovers Cognito OIDC endpoints before accepting requests
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

start();

export default app;
