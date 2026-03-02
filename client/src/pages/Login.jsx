import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "../context/Authcontext";
import { authService } from "../services/authService";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    login,
    user,
    loading: authLoading,
    error: authError,
    clearError,
  } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const params = new URLSearchParams(location.search);
  const googleSuccess = params.get("googleConnected");

  useEffect(() => {
    if (!authLoading && user) {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, location]);

  useEffect(() => {
    if (authError) setError(authError);
  }, [authError]);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(form);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* ── Left decorative panel ────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] gradient-hero flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 -right-10 w-72 h-72 bg-mint-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-forest-600/20 rounded-full blur-2xl pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center shadow-lg p-1.5">
            <img
              src="/harbor.png"
              alt="Mind Harbor"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">
              Mind Harbor
            </h1>
            <p className="text-[10px] text-text-muted -mt-0.5">
              Your safe space
            </p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-text-primary leading-snug mb-4">
              Your mental wellness
              <br />
              <span className="text-emerald-400">journey starts here.</span>
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
              Track your mood, talk to your AI companion, and build habits that
              help you thrive — all in one calm, private space.
            </p>
          </div>

          {/* Stats strip */}
          <div className="flex gap-3">
            {[
              { value: "10k+", label: "Students" },
              { value: "4.9★", label: "Rating" },
              { value: "24/7", label: "Support" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-surface-card/30 backdrop-blur-sm rounded-2xl px-4 py-3 border border-forest-700/20"
              >
                <p className="text-base font-bold text-emerald-300">
                  {s.value}
                </p>
                <p className="text-[11px] text-text-muted">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Mood preview pill */}
          <div className="flex items-center gap-3 bg-surface-card/20 backdrop-blur-sm rounded-2xl px-4 py-3 border border-forest-700/20 w-fit">
            <span className="text-2xl">🌿</span>
            <div>
              <p className="text-xs font-medium text-text-primary">
                Face Mood Detection
              </p>
              <p className="text-[11px] text-text-muted">
                AI reads your emotion via camera
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-text-muted relative z-10 italic">
          "It's okay to not be okay. What matters is you're here."
        </p>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-14">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-10 lg:hidden">
          <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center p-1.5">
            <img
              src="/harbor.png"
              alt="Mind Harbor"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-lg font-bold text-text-primary">Mind Harbor</h1>
        </div>

        <div className="w-full max-w-[360px]">
          <h2 className="text-2xl font-bold text-text-primary mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-text-muted mb-8">
            Sign in to your safe space
          </p>

          {/* Google success toast */}
          {googleSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 animate-fade-in">
              <span className="text-emerald-400 text-sm">
                ✓ Google account connected!
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2 animate-fade-in">
              <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Google button */}
          <button
            onClick={authService.loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl
              bg-surface-card border border-forest-700/50 hover:border-forest-600
              text-sm font-medium text-text-primary
              transition-all duration-200 hover:bg-surface-hover mb-5"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-forest-700/40" />
            <span className="text-xs text-text-muted px-1">or with email</span>
            <div className="flex-1 h-px bg-forest-700/40" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@university.edu"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-card rounded-xl
                    text-sm text-text-primary placeholder:text-text-muted
                    border border-forest-700/40 focus:border-forest-600
                    focus:outline-none focus:ring-2 focus:ring-forest-600/30
                    transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-text-secondary">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-surface-card rounded-xl
                    text-sm text-text-primary placeholder:text-text-muted
                    border border-forest-700/40 focus:border-forest-600
                    focus:outline-none focus:ring-2 focus:ring-forest-600/30
                    transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                bg-forest-700 hover:bg-forest-600 text-white font-medium text-sm
                shadow-sm shadow-forest-900
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {" "}
                  Sign in <ArrowRight size={15} />{" "}
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-text-muted mt-6">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Create one free
            </Link>
          </p>
        </div>

        <p className="mt-12 text-xs text-text-muted text-center">
          Need immediate help?{" "}
          <a href="tel:9152987821" className="text-emerald-400 hover:underline">
            iCall: 9152987821
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
