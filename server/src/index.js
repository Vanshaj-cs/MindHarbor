import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import session from "express-session";

import connectDB from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

// ── Session (only used during Google OAuth flow to hold nonce + state) ─────────
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 5 * 60 * 1000 }, // 5 min – just long enough for OAuth
  }),
);

// ── Middleware ─────────────────────────────────────────────────────────────────
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
  res.status(404).json({ success: false, message: "Route not found." }),
);

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start: only DB connection needed on boot, OIDC is lazy ───────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    // NOTE: OIDC client (for Google login) initializes lazily on first Google request
    // Email/password register, login, etc. work immediately without Cognito discovery
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

start();

export default app;
