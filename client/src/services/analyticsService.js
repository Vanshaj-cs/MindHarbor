import { request } from "./authService"; // adjust path if request is exported from a different file

export const analyticsService = {
  endSession: (sessionId) =>
    request(`/analytics/sessions/${sessionId}/end`, { method: "POST" }),

  getAnalytics: () => request("/analytics"),
};
