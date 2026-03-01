import { GoogleGenAI } from "@google/genai";

// ─────────────────────────────────────────────────────────────
// Initialize Gemini
// ─────────────────────────────────────────────────────────────
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

console.log(
  process.env.GEMINI_API_KEY
    ? "✅ Gemini API key loaded"
    : "❌ Gemini API key missing",
);

// ─────────────────────────────────────────────────────────────
// Mood Descriptions
// ─────────────────────────────────────────────────────────────
const MOOD_DESCRIPTIONS = {
  very_sad: "feeling very sad and down",
  sad: "feeling sad",
  neutral: "feeling neutral / okay",
  happy: "feeling happy",
  very_happy: "feeling very happy and energetic",
  anxious: "feeling anxious and worried",
  stressed: "feeling stressed and overwhelmed",
  calm: "feeling calm and relaxed",
};

// ─────────────────────────────────────────────────────────────
// Build System Prompt
// ─────────────────────────────────────────────────────────────
export const buildSystemPrompt = (moodContext) => {
  const moodDesc = moodContext?.label
    ? MOOD_DESCRIPTIONS[moodContext.label] || moodContext.label
    : "unknown mood";

  const moodScore = moodContext?.score
    ? `${moodContext.score}/10`
    : "not recorded";

  const detectedVia =
    moodContext?.detectedVia === "facial"
      ? "facial expression analysis"
      : moodContext?.detectedVia || "self-report";

  return `You are MindSpace AI, a compassionate and supportive mental health chatbot designed specifically for university students in India.

STUDENT'S CURRENT EMOTIONAL STATE:
- Mood: ${moodDesc}
- Mood score: ${moodScore}
- Detected via: ${detectedVia}
- Recorded at: ${
    moodContext?.recordedAt
      ? new Date(moodContext.recordedAt).toLocaleString("en-IN")
      : "recently"
  }

YOUR ROLE:
- Provide empathetic, non-judgmental emotional support tailored to the student's current mood
- Offer practical coping strategies appropriate to their emotional state
- If mood score is 3 or below (very_sad, anxious, stressed), gently check in about their wellbeing first before giving advice
- If mood score is 7 or above (happy, very_happy, calm), engage positively
- Use simple, warm, conversational language — not clinical or robotic
- Suggest breathing exercises, mindfulness, journaling, or peer support when appropriate
- If the student expresses thoughts of self-harm or crisis, immediately provide iCall helpline (9152987821)

BOUNDARIES:
- Do not diagnose
- Do not prescribe medication
- Keep responses concise (3-5 sentences max)
- Always end with an open question`;
};

// ─────────────────────────────────────────────────────────────
// Send Message to Gemini (NEW SDK)
// ─────────────────────────────────────────────────────────────
export const sendMessage = async (
  userMessage,
  chatHistory = [],
  moodContext = null,
) => {
  try {
    const systemPrompt = buildSystemPrompt(moodContext);

    // 🔥 Trim history to last 5 messages to save tokens
    const trimmedHistory = chatHistory.slice(-5);

    // Convert DB format → Gemini format
    const formattedHistory = trimmedHistory.map((msg) => ({
      role: msg.role === "model" ? "assistant" : "user",
      parts: [{ text: msg.content }],
    }));

    // Combine system prompt + history + current message
    const contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      ...formattedHistory,
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ];

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash", // Safe + stable
      contents,
      generationConfig: {
        maxOutputTokens: 300, // Lowered to save quota
        temperature: 0.75,
        topP: 0.9,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini error:", error.message);
    throw new Error("AI service unavailable. Please try again.");
  }
};
