import { useState } from "react";
import Button from "../components/common/Button";
import Avatar from "../components/common/Avatar";
import Badge from "../components/common/Badge";
import ProgressBar from "../components/common/ProgressBar";
import Modal from "../components/common/Modal";
import { useAuth } from "../context/Authcontext";
import { authService } from "../services/authService";
import {
  Mail,
  GraduationCap,
  Edit3,
  Shield,
  User,
  BookOpen,
  Hash,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

// ── Extract institution safely from the nested object ─────────────────────────
const getInstitutionDisplay = (institution) => {
  if (!institution || typeof institution !== "object") return null;
  // Return the name string, or null if empty/missing
  return institution.name && String(institution.name).trim()
    ? String(institution.name).trim()
    : null;
};

// ── Inline editable field component ──────────────────────────────────────────
const Field = ({
  label,
  value,
  name,
  placeholder,
  onChange,
  type = "text",
}) => (
  <div>
    <label className="block text-xs font-medium text-text-secondary mb-1.5">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 bg-surface-card rounded-xl
        text-sm text-text-primary placeholder:text-text-muted
        border border-forest-700/40 focus:border-forest-600
        focus:outline-none focus:ring-2 focus:ring-forest-600/30
        transition-all duration-200"
    />
  </div>
);

// ── Edit Profile Modal ────────────────────────────────────────────────────────
const EditProfileModal = ({ isOpen, onClose, user, onSaved }) => {
  const [form, setForm] = useState({
    fullName: user.fullName || "",
    username: user.username || "",
    institutionName: user.institution?.name || "",
    institutionDepartment: user.institution?.department || "",
    institutionYear: String(user.institution?.yearOfStudy || ""),
    institutionStudentId: user.institution?.studentId || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!form.username.trim()) {
      setError("Username is required.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const payload = {
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        institution: {
          name: form.institutionName.trim() || undefined,
          department: form.institutionDepartment.trim() || undefined,
          yearOfStudy: form.institutionYear
            ? Number(form.institutionYear)
            : undefined,
          studentId: form.institutionStudentId.trim() || undefined,
        },
      };

      const res = await authService.updateProfile(payload);
      onSaved(res.data); // update context
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
            <AlertCircle size={15} className="text-red-400 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-300">Profile saved!</p>
          </div>
        )}

        {/* Personal */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
            <User size={12} /> Personal
          </p>
          <div className="space-y-3">
            <Field
              label="Full Name"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Tushar Agarwal"
            />
            <Field
              label="Username"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="tushar_a"
            />
          </div>
        </div>

        <div className="h-px bg-forest-700/30" />

        {/* Institution */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
            <BookOpen size={12} /> Institution{" "}
            <span className="text-[10px] font-normal normal-case tracking-normal">
              (optional)
            </span>
          </p>
          <div className="space-y-3">
            <Field
              label="College / University"
              name="institutionName"
              value={form.institutionName}
              onChange={handleChange}
              placeholder="IIT Delhi"
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Department"
                name="institutionDepartment"
                value={form.institutionDepartment}
                onChange={handleChange}
                placeholder="Computer Science"
              />
              <Field
                label="Year of Study"
                name="institutionYear"
                value={form.institutionYear}
                onChange={handleChange}
                placeholder="3"
                type="number"
              />
            </div>
            <Field
              label="Student ID"
              name="institutionStudentId"
              value={form.institutionStudentId}
              onChange={handleChange}
              placeholder="2021CS1234"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-forest-700/50 text-sm text-text-secondary hover:bg-surface-hover transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || success}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
              bg-forest-700 hover:bg-forest-600 text-white font-medium text-sm
              shadow-sm shadow-forest-900 transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Saving…
              </>
            ) : success ? (
              <>
                <CheckCircle2 size={15} /> Saved!
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ── Main Profile page ─────────────────────────────────────────────────────────
const Profile = () => {
  const { user, setUser } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

  if (!user) return null;

  // ── Safe field extraction ─────────────────────────────────────────────────
  const displayName = String(
    user.fullName || user.username || user.email || "",
  );
  const email = String(user.email || "");
  const authProvider = String(user.authProvider || "");
  const loginCount = Number(user.loginCount) || 1;
  const moodCount = Number(user.moodHistory?.length) || 0;

  // Institution is a nested object — extract each field as a string
  const inst =
    typeof user.institution === "object" && user.institution !== null
      ? user.institution
      : {};
  const institutionName = inst.name ? String(inst.name).trim() : null;
  const department = inst.department ? String(inst.department).trim() : null;
  const yearOfStudy = inst.yearOfStudy ? String(inst.yearOfStudy) : null;
  const studentId = inst.studentId ? String(inst.studentId).trim() : null;

  // Build sub-label for hero (e.g. "Computer Science, Year 3 · IIT Delhi")
  const institutionSubline =
    [
      department && yearOfStudy
        ? `${department}, Year ${yearOfStudy}`
        : department || (yearOfStudy ? `Year ${yearOfStudy}` : null),
      institutionName,
    ]
      .filter(Boolean)
      .join(" · ") || null;

  // Streak
  const streak = (() => {
    if (!user.moodHistory?.length) return 0;
    try {
      const sorted = [...user.moodHistory].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      let count = 1;
      for (let i = 1; i < sorted.length; i++) {
        const diff =
          (new Date(sorted[i - 1].createdAt) - new Date(sorted[i].createdAt)) /
          86400000;
        if (diff <= 1.5) count++;
        else break;
      }
      return count;
    } catch {
      return 0;
    }
  })();

  const handleSaved = (updatedUser) => {
    // Update auth context with fresh user data from server
    if (setUser) setUser(updatedUser);
    else window.location.reload(); // fallback if setUser not exposed
  };

  return (
    <div>
      {/* Hero */}
      <section className="gradient-hero px-5 lg:px-8 pt-10 pb-14 lg:pt-14 lg:pb-20">
        <div className="max-w-5xl">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar src={user.profilePicture} name={displayName} size="xl" />

            <div className="flex-1">
              <p className="section-label text-emerald-400 mb-2">
                Your profile
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">
                {displayName}
              </h1>

              {/* Institution sub-line or dash */}
              <p className="text-base text-text-secondary mt-1">
                {institutionSubline || "—"}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge color="lavender">Active Member</Badge>
                {streak >= 3 && (
                  <Badge color="mint">{streak}-Day Streak 🔥</Badge>
                )}
                {authProvider === "google" && <Badge color="sky">Google</Badge>}
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={Edit3}
              className="shrink-0"
              onClick={() => setEditOpen(true)}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="content-contained space-y-14 py-10">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Main */}
          <div className="lg:col-span-7 space-y-12">
            <div>
              <p className="section-label text-text-muted mb-1">Details</p>
              <h3 className="text-lg font-semibold text-text-primary mb-6">
                Personal Information
              </h3>
              <div className="space-y-4">
                {/* Email */}
                <div className="flex items-center gap-4 py-2">
                  <Mail
                    size={16}
                    className="text-emerald-400 shrink-0"
                    strokeWidth={1.8}
                  />
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider">
                      Email
                    </p>
                    <p className="text-sm text-text-primary mt-0.5">{email}</p>
                  </div>
                </div>

                {/* Institution name */}
                <div className="flex items-center gap-4 py-2">
                  <GraduationCap
                    size={16}
                    className="text-emerald-400 shrink-0"
                    strokeWidth={1.8}
                  />
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider">
                      Institution
                    </p>
                    <p className="text-sm text-text-primary mt-0.5">
                      {institutionName || "—"}
                    </p>
                  </div>
                </div>

                {/* Department */}
                <div className="flex items-center gap-4 py-2">
                  <BookOpen
                    size={16}
                    className="text-emerald-400 shrink-0"
                    strokeWidth={1.8}
                  />
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider">
                      Department
                    </p>
                    <p className="text-sm text-text-primary mt-0.5">
                      {department
                        ? `${department}${yearOfStudy ? `, Year ${yearOfStudy}` : ""}`
                        : "—"}
                    </p>
                  </div>
                </div>

                {/* Student ID */}
                <div className="flex items-center gap-4 py-2">
                  <Hash
                    size={16}
                    className="text-emerald-400 shrink-0"
                    strokeWidth={1.8}
                  />
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider">
                      Student ID
                    </p>
                    <p className="text-sm text-text-primary mt-0.5">
                      {studentId || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="section-rule" />

            {/* Activity stats */}
            <div>
              <p className="section-label text-text-muted mb-1">Stats</p>
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Activity
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Mood logs", value: moodCount },
                  { label: "Day streak", value: streak },
                  { label: "Logins", value: loginCount },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-surface-card/30 rounded-2xl p-4 text-center"
                  >
                    <p className="text-2xl font-bold text-emerald-300">
                      {s.value}
                    </p>
                    <p className="text-xs text-text-muted mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-5 space-y-12">
            <div>
              <p className="section-label text-text-muted mb-1">Wellness</p>
              <h3 className="text-lg font-semibold text-text-primary mb-6">
                Summary
              </h3>
              <div className="space-y-4">
                <ProgressBar
                  value={Math.min(moodCount * 10, 100)}
                  label="Mood Tracking"
                  color="lavender"
                />
                <ProgressBar
                  value={Math.min(streak * 14, 100)}
                  label="Consistency"
                  color="mint"
                />
                <ProgressBar
                  value={Math.min(loginCount * 5, 100)}
                  label="Engagement"
                  color="sky"
                />
              </div>
            </div>

            <div className="section-rule" />

            <div>
              <p className="section-label text-text-muted mb-1">Milestones</p>
              <h3 className="text-lg font-semibold text-text-primary mb-6">
                Achievements
              </h3>
              <div className="space-y-3">
                {[
                  {
                    icon: "🚀",
                    label: "First Login",
                    desc: "Started your wellness journey",
                    unlocked: true,
                  },
                  {
                    icon: "😊",
                    label: "First Mood",
                    desc: "Logged your first mood",
                    unlocked: moodCount >= 1,
                  },
                  {
                    icon: "🔥",
                    label: "3-Day Streak",
                    desc: "Logged mood 3 days in a row",
                    unlocked: streak >= 3,
                  },
                  {
                    icon: "💬",
                    label: "First Chat",
                    desc: "Started an AI support session",
                    unlocked: false,
                  },
                ].map((a) => (
                  <div
                    key={a.label}
                    className={`flex items-center gap-3 ${!a.unlocked ? "opacity-35" : ""}`}
                  >
                    <span className="text-lg">{a.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {a.label}
                      </p>
                      <p className="text-xs text-text-muted">{a.desc}</p>
                    </div>
                    {a.unlocked && (
                      <span className="ml-auto text-xs text-emerald-400">
                        ✓
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-tint rounded-2xl px-5 py-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Shield
                  size={14}
                  className="text-emerald-400"
                  strokeWidth={1.8}
                />
                <h3 className="text-sm font-medium text-text-primary">
                  Privacy Assured
                </h3>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Your data is encrypted and your sessions are completely
                confidential.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Edit Modal */}
      <EditProfileModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
        onSaved={handleSaved}
      />
    </div>
  );
};

export default Profile;
