import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const nlpAxios = axios.create(); // isolated — no auth token leaking

const NLP_URL = process.env.NLP_SERVICE_URL || "http://localhost:7000/predict";

export const analyzeMessage = async (userId, message, timestamp) => {
  const payload = {
    user_id: userId.toString(),
    timestamp: timestamp || new Date().toISOString(),
    message,
  };

  const response = await nlpAxios.post(NLP_URL, payload, {
    timeout: 15000,
  });

  // Returns: { mental_score, dominant_emotion, confidence, status }
  return response.data;
};

export const analyzeSessionMessages = async (userId, messages) => {
  // Analyze each user message and average the scores
  const results = await Promise.all(
    messages.map((msg) =>
      analyzeMessage(
        userId,
        msg.content,
        new Date(msg.createdAt).toISOString(),
      ).catch((err) => {
        console.error("NLP single message error:", err.message);
        return null;
      }),
    ),
  );

  const valid = results.filter((r) => r !== null && r.mental_score != null);
  if (!valid.length) return null;

  // Average score across all messages
  const avgScore = valid.reduce((a, b) => a + b.mental_score, 0) / valid.length;

  // Pick dominant emotion by highest confidence
  const best = valid.reduce((a, b) =>
    (b.confidence ?? 0) > (a.confidence ?? 0) ? b : a,
  );

  return {
    mental_score: parseFloat(avgScore.toFixed(4)),
    dominant_emotion: best.dominant_emotion,
    confidence: best.confidence,
    status: best.status,
  };
};
