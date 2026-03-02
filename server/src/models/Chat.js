import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "model"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
  },
  { timestamps: true },
);

const ChatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Snapshot of mood at the time session started
    // Pulled from user.moodHistory at session creation
    moodContext: {
      score: Number,
      label: String,
      detectedVia: String,
      recordedAt: Date,
    },

    messages: [MessageSchema],

    // Title auto-generated from first user message
    title: { type: String, default: "New Session" },

    isActive: { type: Boolean, default: true },
    mentalScore: { type: Number, default: null },
    dominantEmotion: { type: String, default: null },
    emotionConfidence: { type: Number, default: null },
    distressStatus: { type: String, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("Chat", ChatSessionSchema);
