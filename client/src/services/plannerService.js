const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const request = async (endpoint, options = {}) => {
  const res = await fetch(`${BASE}${endpoint}`, {
    credentials: "include",
    headers: {
      "Cache-Control": "no-cache", // ← add this
      ...options.headers,
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data;
};

export const plannerService = {
  // POST /api/planner/generate-plan  (multipart/form-data)
  generatePlan: (formData) =>
    request("/planner/generate-plan", {
      method: "POST",
      body: formData, // FormData — no Content-Type header (browser sets boundary)
    }),

  // GET /api/planner/plans
  getPlans: () => request("/planner/plans"),

  // GET /api/planner/plans/:planId
  getPlan: (planId) => request(`/planner/plans/${planId}`),

  // GET /api/planner/google/status
  getGoogleStatus: () => request("/planner/google/status"),

  // GET /api/planner/auth/google  (redirect — open in same tab)
  connectGoogle: () => {
    window.location.href = `${BASE}/planner/auth/google`;
  },

  // POST /api/planner/calendar/sync
  syncToCalendar: (planId) =>
    request("/planner/calendar/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    }),
};
