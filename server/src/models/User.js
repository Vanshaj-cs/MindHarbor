import mongoose from "mongoose";

const MoodEntrySchema = new mongoose.Schema(
  {
    score: { type: Number, min: 1, max: 10, required: true },
    label: {
      type: String,
      enum: ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"],
    },
    note: { type: String, maxlength: 500 },
    detectedVia: {
      type: String,
      enum: ["manual", "facial", "chatbot"],
      default: "manual",
    },
  },
  { timestamps: true },
);

const UserSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    cognitoId: { type: String, unique: true, sparse: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    fullName: { type: String, trim: true },
    profilePicture: { type: String, default: null },

    // ── Auth ──────────────────────────────────────────────────────────────────
    authProvider: {
      type: String,
      enum: ["cognito", "google", "both"],
      default: "cognito",
    },
    googleId: { type: String, sparse: true },

    // ── Role & Status ─────────────────────────────────────────────────────────
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },

    // ── Institution ───────────────────────────────────────────────────────────
    institution: {
      name: String,
      studentId: String,
      department: String,
      yearOfStudy: Number,
    },

    // ── Preferences ───────────────────────────────────────────────────────────
    preferences: {
      language: { type: String, default: "en" },
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      notificationsEnabled: { type: Boolean, default: true },
    },

    // ── Mental Health Data ────────────────────────────────────────────────────
    moodHistory: [MoodEntrySchema],
    savedResources: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resource" }],

    // ── Login Tracking ────────────────────────────────────────────────────────
    lastLogin: { type: Date },
    loginCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// ── Safe object (strip sensitive fields) ─────────────────────────────────────
UserSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    email: this.email,
    username: this.username,
    fullName: this.fullName,
    profilePicture: this.profilePicture,
    role: this.role,
    authProvider: this.authProvider,
    isEmailVerified: this.isEmailVerified,
    institution: this.institution,
    preferences: this.preferences,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
  };
};

export default mongoose.model("User", UserSchema);
