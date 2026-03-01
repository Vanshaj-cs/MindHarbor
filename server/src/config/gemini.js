import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Get the Gemini model ──────────────────────────────────────────────────────
export const getGeminiModel = () =>
  genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ── Build the system prompt using student's mood context ──────────────────────
export const buildSystemPrompt = (user, moodSnapshot) => {
  const { score, label, recentAverage } = moodSnapshot || {};

  // Describe current emotional state
  let moodDescription = "no recent mood data available";
  if (score) {
    moodDescription = `current mood score: ${score}/10 (${label || "unspecified"})`;
    if (recentAverage) {
      moodDescription += `, 7-day average: ${recentAverage.toFixed(1)}/10`;
      const trend =
        recentAverage < score
          ? "improving"
          : recentAverage > score
            ? "declining"
            : "stable";
      moodDescription += ` (trend: ${trend})`;
    }
  }

  // Tone guidance based on mood score
  let toneGuidance = "";
  if (!score || score >= 7) {
    toneGuidance =
      "The student seems to be doing well. Be warm and encouraging. Reinforce positive habits.";
  } else if (score >= 5) {
    toneGuidance =
      "The student is feeling neutral or slightly low. Be supportive and gently explore what might help them feel better.";
  } else if (score >= 3) {
    toneGuidance =
      "The student is feeling low. Be extra empathetic, validate their feelings, and suggest small actionable steps. Do not overwhelm them.";
  } else {
    toneGuidance =
      "The student is in distress. Be calm, compassionate, and non-judgmental. Prioritize emotional safety. If they express self-harm or crisis, encourage them to reach out to a counselor or helpline (iCall: 9152987821).";
  }

  return `You are MindSpace, a compassionate AI mental health support companion for college students in India.

STUDENT CONTEXT:
- Name: ${user.fullName || "Student"}
- Institution: ${user.institution?.name || "Not specified"}
- Mood data: ${moodDescription}

YOUR PERSONALITY:
- Warm, non-judgmental, and empathetic
- Speak in a friendly, conversational tone (not clinical)
- Use simple language — avoid jargon
- Keep responses concise (3-5 sentences unless the student needs more)
- Never diagnose or prescribe medication
- You are not a replacement for professional help

CURRENT GUIDANCE:
${toneGuidance}

IMPORTANT RULES:
- Always validate the student's feelings before offering advice
- Ask one follow-up question at a time
- If the student mentions self-harm, suicide, or crisis → immediately share iCall helpline: 9152987821
- Never share harmful information
- If asked who you are, say you are MindSpace AI, a mental wellness companion`;
};
