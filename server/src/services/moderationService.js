import { GoogleGenAI } from "@google/genai";
import { getDB } from "../config/firebase.js";
import fetch from "node-fetch";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── Ban hours per severity level ───────────────────────────────────────────────
// Gemini returns one of: CLEAN | MILD | MODERATE | SEVERE | EXTREME
const BAN_HOURS = {
  CLEAN: 0,
  MILD: 24, // minor language, borderline → 1 day warning
  MODERATE: 72, // clear profanity, offensive → 3 days
  SEVERE: 168, // hate speech, explicit, threats → 7 days
  EXTREME: 720, // CSAM indicators, severe threats → 30 days + admin flag
};

// ── Fetch URL → base64 for Gemini inline image data ──────────────────────────
const urlToBase64 = async (url) => {
  const res = await fetch(url);
  const buffer = await res.buffer();
  return buffer.toString("base64");
};

const guessMimeType = (url) => {
  const u = url.toLowerCase();
  if (u.includes(".png")) return "image/png";
  if (u.includes(".webp")) return "image/webp";
  if (u.includes(".gif")) return "image/gif";
  return "image/jpeg";
};

// ─────────────────────────────────────────────────────────────────────────────
//  CORE: Analyse content with Gemini
//  text      — post/comment text (or null)
//  mediaFiles — [{ url, type: 'image'|'video', fileName }]
// ─────────────────────────────────────────────────────────────────────────────
export const analyzeContent = async (text, mediaFiles = []) => {
  if (!text?.trim() && !mediaFiles.length) {
    return {
      severity: "CLEAN",
      flagged: false,
      reason: null,
      categories: [],
      containsSelfHarmRisk: false,
      banHours: 0,
    };
  }

  try {
    const parts = [];

    // System prompt
    parts.push({
      text: `You are a content moderation AI for MindSpace — a mental health support platform for Indian university students.

Analyze the submitted content (text and/or images) for guideline violations.

ALLOWED (do NOT flag):
- Emotional expression: sadness, anxiety, loneliness, frustration, heartbreak
- Discussing mental health struggles, exam stress, relationship issues
- Venting or seeking support
- Mildly informal language that isn't offensive

NOT ALLOWED (flag these):
- Profanity or slurs in English or Hindi/Hinglish (e.g. chutiya, bhenchod, madarchod, fuck, bitch, etc.)
- Sexual, explicit, or pornographic content
- Graphic violence or gore
- Hate speech (religion, caste, gender, race, ethnicity)
- Bullying or targeted harassment
- Promotion of self-harm or suicide methods (distress about suicidal feelings is OK and should NOT be flagged — only explicit method-sharing)
- Spam or unrelated commercial content

SEVERITY SCALE:
CLEAN    - No violation whatsoever
MILD     - Very minor: a borderline word, nothing serious — warn but allow? No, MILD still gets flagged
MODERATE - Clear violation: obvious profanity, offensive content
SEVERE   - Serious: hate speech, explicit content, graphic violence
EXTREME  - Critical: CSAM, specific self-harm method instructions, direct credible threats

Respond ONLY with valid JSON, no markdown, no explanation:
{
  "severity": "CLEAN|MILD|MODERATE|SEVERE|EXTREME",
  "flagged": true|false,
  "reason": "one sentence explanation, or null if CLEAN",
  "categories": [],
  "containsSelfHarmRisk": true|false
}`,
    });

    if (text?.trim()) {
      parts.push({ text: `Content to moderate:\n${text.trim()}` });
    }

    // Add images inline
    for (const media of mediaFiles) {
      try {
        if (media.type === "image") {
          const b64 = await urlToBase64(media.url);
          parts.push({
            inlineData: { data: b64, mimeType: guessMimeType(media.url) },
          });
        } else if (media.type === "video") {
          // Videos: pass URL as text for now; Gemini video analysis via File API needs async upload
          parts.push({
            text: `[VIDEO CONTENT attached — URL: ${media.url}. Flag if you have reason to believe it violates guidelines based on context.]`,
          });
        }
      } catch (e) {
        console.warn("[Moderation] Media fetch error:", e.message);
      }
    }

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts }],
      config: {
        maxOutputTokens: 200,
        temperature: 0.05, // deterministic
        topP: 0.95,
      },
    });

    const raw = response.text?.trim() || "";

    // Robustly extract the first {...} JSON object from Gemini's response.
    // Gemini sometimes wraps output in markdown, adds preamble, or truncates.
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch)
      throw new Error(
        `No JSON object found in Gemini response: ${raw.slice(0, 120)}`,
      );

    // Attempt to parse; if still broken, try to auto-close truncated JSON
    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch {
      // Auto-repair: count open braces and close them
      const partial = jsonMatch[0];
      const opens = (partial.match(/\{/g) || []).length;
      const closes = (partial.match(/\}/g) || []).length;
      const repaired = partial + "}".repeat(Math.max(0, opens - closes));
      result = JSON.parse(repaired);
    }

    if (!BAN_HOURS.hasOwnProperty(result.severity))
      throw new Error("Bad severity");

    return {
      severity: result.severity,
      flagged: result.flagged === true,
      reason: result.reason || null,
      categories: Array.isArray(result.categories) ? result.categories : [],
      containsSelfHarmRisk: result.containsSelfHarmRisk === true,
      banHours: BAN_HOURS[result.severity],
    };
  } catch (err) {
    console.error("[Moderation] Gemini error:", err.message);
    // Fail OPEN — Gemini unavailable shouldn't block all posts.
    // Change to return { flagged: true } here if you prefer strict/fail-closed.
    return {
      severity: "CLEAN",
      flagged: false,
      reason: null,
      categories: [],
      containsSelfHarmRisk: false,
      banHours: 0,
      geminiUnavailable: true,
    };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  Record violation + calculate dynamic ban with escalation
// ─────────────────────────────────────────────────────────────────────────────
export const recordViolation = async (
  userId,
  { severity, reason, categories, banHours },
) => {
  const db = getDB();
  const ref = db.collection("moderation").doc(userId);
  const doc = await ref.get();
  const now = new Date();

  const prev = doc.exists
    ? doc.data()
    : { strikes: 0, isBlocked: false, violations: [] };
  const newStrikes = (prev.strikes || 0) + 1;

  // Escalation: each repeat offence in active cycle multiplies ban by 1.5x
  const escalation = Math.max(1, 1 + (newStrikes - 1) * 0.5);
  const effectiveBanHrs = Math.min(Math.round(banHours * escalation), 720);

  const isBlocked = effectiveBanHrs > 0;
  const blockedUntil = isBlocked
    ? new Date(now.getTime() + effectiveBanHrs * 3600 * 1000)
    : null;

  const violation = {
    severity,
    reason,
    categories: categories || [],
    banHours: effectiveBanHrs,
    strikeNumber: newStrikes,
    recordedAt: now.toISOString(),
  };

  await ref.set(
    {
      userId,
      strikes: newStrikes,
      isBlocked,
      blockedUntil: blockedUntil?.toISOString() || null,
      violations: [...(prev.violations || []), violation],
      lastViolationAt: now.toISOString(),
      needsAdminReview:
        severity === "EXTREME" ? true : prev.needsAdminReview || false,
      updatedAt: now.toISOString(),
    },
    { merge: true },
  );

  return {
    isBlocked,
    strikes: newStrikes,
    blockedUntil: blockedUntil?.toISOString() || null,
    banHours: effectiveBanHrs,
    severity,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
//  Get moderation status with auto-unblock
// ─────────────────────────────────────────────────────────────────────────────
export const getModerationStatus = async (userId) => {
  const db = getDB();
  const doc = await db.collection("moderation").doc(userId).get();
  if (!doc.exists) return { isBlocked: false, strikes: 0 };

  const data = doc.data();
  const now = new Date();

  if (
    data.isBlocked &&
    data.blockedUntil &&
    new Date(data.blockedUntil) < now
  ) {
    await db
      .collection("moderation")
      .doc(userId)
      .update({ isBlocked: false, strikes: 0, unblockedAt: now.toISOString() });
    return { isBlocked: false, strikes: 0 };
  }

  return {
    isBlocked: data.isBlocked || false,
    strikes: data.strikes || 0,
    blockedUntil: data.blockedUntil || null,
    violations: data.violations || [],
    needsAdminReview: data.needsAdminReview || false,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
//  Middleware: reject requests from blocked users
// ─────────────────────────────────────────────────────────────────────────────
export const checkNotBlocked = async (req, res, next) => {
  try {
    const status = await getModerationStatus(req.user._id.toString());
    if (status.isBlocked) {
      const until = status.blockedUntil
        ? new Date(status.blockedUntil).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "further notice";
      return res.status(403).json({
        success: false,
        message: `Your account has been suspended for violating community guidelines. You can post again after ${until}.`,
        blockedUntil: status.blockedUntil,
        strikes: status.strikes,
        isBlocked: true,
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};
