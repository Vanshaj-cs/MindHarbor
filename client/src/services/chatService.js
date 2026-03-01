const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const request = async (endpoint, options = {}) => {
  const res = await fetch(`${BASE}${endpoint}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data;
};

export const chatService = {
  // POST /api/chat/sessions
  startSession: () => request("/chat/sessions", { method: "POST" }),

  // GET /api/chat/sessions
  getSessions: () => request("/chat/sessions"),

  // GET /api/chat/sessions/:sessionId
  getSession: (sessionId) => request(`/chat/sessions/${sessionId}`),

  // POST /api/chat/sessions/:sessionId/message
  sendMessage: (sessionId, message) =>
    request(`/chat/sessions/${sessionId}/message`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  // DELETE /api/chat/sessions/:sessionId
  deleteSession: (sessionId) =>
    request(`/chat/sessions/${sessionId}`, { method: "DELETE" }),

  // DELETE /api/chat/sessions/:sessionId/history
  clearHistory: (sessionId) =>
    request(`/chat/sessions/${sessionId}/history`, { method: "DELETE" }),
};
