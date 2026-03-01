import { GoogleGenAI } from "@google/genai";
import ChatSummary from "../models/ChatSummary.js";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MAX_RETRIEVED_SUMMARIES = 3;
const MIN_MESSAGES_TO_SUMMARIZE = 4;

// ─────────────────────────────────────────────────────────────
// 1️⃣ SUMMARIZE a completed session and store it as RAG doc
// ─────────────────────────────────────────────────────────────
export const summarizeAndStoreSession = async (session) => {
  try {
    if (
      !session.messages ||
      session.messages.length < MIN_MESSAGES_TO_SUMMARIZE
    ) {
      console.log(
        `[RAG] Session ${session._id} has too few messages to summarize. Skipping.`,
      );
      return null;
    }

    const conversationText = session.messages
      .map((m) => `${m.role === "user" ? "Student" : "AI"}: ${m.content}`)
      .join("\n");

    const moodLabel = session.moodContext?.label || "unknown";
    const moodScore = session.moodContext?.score || "N/A";

    const summaryPrompt = `
You are summarizing a mental health support chat session for a university student.

MOOD AT TIME OF CHAT: ${moodLabel} (score: ${moodScore}/10)

CONVERSATION:
${conversationText}

Please provide:
1. SUMMARY: A 3-5 sentence summary in third person ("The student...").
2. THEMES: 3-6 key themes (comma-separated).

Respond EXACTLY like:
SUMMARY: <text>
THEMES: <theme1>, <theme2>, <theme3>
`;

    const response = await genAI.models.generateContent({
      model: "gemini-1.5-flash",
      contents: summaryPrompt,
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.4,
      },
    });

    const text = response.text;

    // Parse response
    const summaryMatch = text.match(/SUMMARY:\s*(.+?)(?=THEMES:|$)/s);
    const themesMatch = text.match(/THEMES:\s*(.+)/s);

    const summary = summaryMatch ? summaryMatch[1].trim() : text.trim();

    const themes = themesMatch
      ? themesMatch[1]
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const stored = await ChatSummary.create({
      userId: session.userId,
      sessionId: session._id,
      moodContext: session.moodContext,
      summary,
      themes,
      messageCount: session.messages.length,
      sessionStartedAt: session.createdAt,
      sessionEndedAt: new Date(),
    });

    console.log(
      `[RAG] Session ${session._id} summarized. Themes: ${themes.join(", ")}`,
    );

    return stored;
  } catch (error) {
    console.error("[RAG] Summarization error:", error.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────
// 2️⃣ RETRIEVE relevant past summaries
// ─────────────────────────────────────────────────────────────
export const retrieveRelevantContext = async (
  userId,
  currentMessage,
  currentMoodLabel,
) => {
  const results = [];

  const moodQuery = { userId };

  if (currentMoodLabel) {
    const moodGroups = {
      negative: ["very_sad", "sad", "anxious", "stressed"],
      positive: ["happy", "very_happy", "calm"],
      neutral: ["neutral"],
    };

    const currentGroup = Object.entries(moodGroups).find(([, moods]) =>
      moods.includes(currentMoodLabel),
    );

    if (currentGroup) {
      moodQuery["moodContext.label"] = { $in: currentGroup[1] };
    }
  }

  const moodMatches = await ChatSummary.find(moodQuery)
    .sort({ createdAt: -1 })
    .limit(MAX_RETRIEVED_SUMMARIES)
    .lean();

  results.push(...moodMatches);

  // Text search
  const words = currentMessage.trim().split(/\s+/);

  if (words.length >= 3) {
    try {
      const textMatches = await ChatSummary.find(
        {
          userId,
          $text: { $search: currentMessage },
          _id: { $nin: results.map((r) => r._id) },
        },
        { score: { $meta: "textScore" } },
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(2)
        .lean();

      results.push(...textMatches);
    } catch (_) {
      // Ignore if text index not ready
    }
  }

  const seen = new Set();
  const unique = results.filter((r) => {
    const id = r._id.toString();
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return unique.slice(0, MAX_RETRIEVED_SUMMARIES);
};

// ─────────────────────────────────────────────────────────────
// 3️⃣ FORMAT retrieved summaries into context block
// ─────────────────────────────────────────────────────────────
export const formatContextBlock = (summaries) => {
  if (!summaries || summaries.length === 0) return null;

  const blocks = summaries.map((s, i) => {
    const date = new Date(s.sessionStartedAt || s.createdAt).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      },
    );

    const mood = s.moodContext?.label
      ? `${s.moodContext.label} (${s.moodContext.score}/10)`
      : "unknown mood";

    const themes = s.themes?.length ? s.themes.join(", ") : "general";

    return `[Past Session ${i + 1} — ${date} | Mood: ${mood} | Topics: ${themes}]
${s.summary}`;
  });

  return `RELEVANT PAST CONTEXT (from student's previous sessions):

${blocks.join("\n\n")}

Use this context to provide consistent, personalized support. Reference past discussions naturally when relevant.`;
};
