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

export const authService = {
  register: ({ email, password, fullName, username }) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, fullName, username }),
    }),

  verifyEmail: ({ email, code }) =>
    request("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }),

  resendVerification: ({ email }) =>
    request("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  login: ({ email, password }) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request("/auth/logout", { method: "POST" }),

  getMe: () => request("/auth/me"),

  forgotPassword: ({ email }) =>
    request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  loginWithGoogle: () => {
    window.location.href = `${BASE}/auth/google`;
  },

  deleteAccount: () => request("/auth/delete-account", { method: "DELETE" }),

  updateProfile: (data) =>
    request("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
