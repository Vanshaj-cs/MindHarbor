import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AtSign,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
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

// OTP Verification step
const VerifyStep = ({ email, onSuccess }) => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[i] = val;
    setCode(next);
    setError("");
    // Auto-focus next
    if (val && i < 5) {
      document.getElementById(`otp-${i + 1}`)?.focus();
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasted.length) {
      const next = [...code];
      pasted.split("").forEach((c, i) => {
        next[i] = c;
      });
      setCode(next);
      document.getElementById(`otp-${Math.min(pasted.length, 5)}`)?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length < 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      await authService.verifyEmail({ email, code: fullCode });
      onSuccess();
    } catch (err) {
      setError(err.message);
      setCode(["", "", "", "", "", ""]);
      document.getElementById("otp-0")?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authService.resendVerification({ email });
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch (_) {}
  };

  return (
    <div className="w-full max-w-[360px] animate-fade-in">
      <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mb-5">
        <Mail size={22} className="text-emerald-400" />
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-1">
        Check your email
      </h2>
      <p className="text-sm text-text-muted mb-2">We sent a 6-digit code to</p>
      <p className="text-sm font-medium text-emerald-300 mb-8">{email}</p>

      {error && (
        <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertCircle size={15} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {resent && (
        <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300">Code resent!</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* OTP boxes */}
        <div className="flex gap-2.5 mb-6" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-full aspect-square text-center text-xl font-bold
                bg-surface-card rounded-xl border border-forest-700/40
                text-text-primary
                focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20
                transition-all duration-200"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
            bg-forest-700 hover:bg-forest-600 text-white font-medium text-sm
            shadow-sm shadow-forest-900
            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {" "}
              Verify email <ArrowRight size={15} />{" "}
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-text-muted mt-5">
        Didn't receive it?{" "}
        <button
          onClick={handleResend}
          className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
        >
          Resend code
        </button>
      </p>
    </div>
  );
};

// Password strength checker
const getStrength = (p) => {
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  return score;
};

const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColor = [
  "",
  "bg-red-400",
  "bg-yellow-400",
  "bg-emerald-400",
  "bg-emerald-300",
];

const Signup = () => {
  const navigate = useNavigate();
  const {
    register,
    user,
    loading: authLoading,
    error: authError,
    clearError,
  } = useAuth();

  const [step, setStep] = useState("form"); // 'form' | 'verify' | 'success'
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = getStrength(form.password);

  useEffect(() => {
    if (!authLoading && user) navigate("/", { replace: true });
  }, [user, authLoading, navigate]);

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
    const { fullName, username, email, password } = form;
    if (!fullName || !username || !email || !password) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register({ fullName, username, email, password });
      setStep("verify");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySuccess = () => setStep("success");

  // ── Success screen ────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-6">
        <div className="text-center max-w-sm animate-fade-in">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle2 size={30} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            You're all set!
          </h2>
          <p className="text-sm text-text-muted mb-8">
            Your account is verified. Welcome to Mind Harbor.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
              bg-forest-700 hover:bg-forest-600 text-white font-medium text-sm
              shadow-sm shadow-forest-900 transition-all duration-200"
          >
            Sign in to your space <ArrowRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  // ── Verify step ───────────────────────────────────────────────────────────
  if (step === "verify") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-6">
        <VerifyStep email={form.email} onSuccess={handleVerifySuccess} />
      </div>
    );
  }

  // ── Form step ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface flex">
      {/* ── Left decorative panel ────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] gradient-hero flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 -right-10 w-72 h-72 bg-mint-500/8 rounded-full blur-3xl pointer-events-none" />

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

        {/* Features list */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-text-primary leading-snug mb-4">
              Start your wellness
              <br />
              <span className="text-emerald-400">journey today.</span>
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
              Join thousands of students who use Mind Harbor to understand their
              emotions and take care of their mental health.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                icon: "🧠",
                title: "AI Mood Detection",
                desc: "Facial expression analysis via TensorFlow",
              },
              {
                icon: "💬",
                title: "RAG-Powered Chat",
                desc: "AI remembers your past sessions",
              },
              {
                icon: "📅",
                title: "Smart Study Planner",
                desc: "Syncs directly to Google Calendar",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-3 bg-surface-card/20 backdrop-blur-sm rounded-2xl p-3.5 border border-forest-700/15"
              >
                <span className="text-xl mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {f.title}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-text-muted relative z-10 italic">
          "Your mental health is just as important as your grades."
        </p>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-14 overflow-y-auto">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
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
            Create account
          </h2>
          <p className="text-sm text-text-muted mb-7">
            Free forever. No credit card needed.
          </p>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2 animate-fade-in">
              <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Google */}
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
            {/* Full name */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Full name
              </label>
              <div className="relative">
                <User
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Vatsal Sharma"
                  autoComplete="name"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-card rounded-xl
                    text-sm text-text-primary placeholder:text-text-muted
                    border border-forest-700/40 focus:border-forest-600
                    focus:outline-none focus:ring-2 focus:ring-forest-600/30
                    transition-all duration-200"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Username
              </label>
              <div className="relative">
                <AtSign
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="vatsal_s"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-card rounded-xl
                    text-sm text-text-primary placeholder:text-text-muted
                    border border-forest-700/40 focus:border-forest-600
                    focus:outline-none focus:ring-2 focus:ring-forest-600/30
                    transition-all duration-200"
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Password + strength */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Password
              </label>
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
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
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
              {/* Strength bar */}
              {form.password && (
                <div className="mt-2 animate-fade-in">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                          i <= strength
                            ? strengthColor[strength]
                            : "bg-forest-800/40"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-text-muted">
                    {strengthLabel[strength]} password
                  </p>
                </div>
              )}
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
                  Create account <ArrowRight size={15} />{" "}
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-text-muted mt-4">
            By signing up, you agree to our{" "}
            <a href="#" className="text-emerald-400 hover:underline">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="text-emerald-400 hover:underline">
              Privacy Policy
            </a>
            .
          </p>

          <p className="text-center text-sm text-text-muted mt-5">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
