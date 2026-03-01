import { Router } from "express";

const router = Router();
// ── Health Check ──────────────────────────────────────────────────────────────
router.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);
export default router;
