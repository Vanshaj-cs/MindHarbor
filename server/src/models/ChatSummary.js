import mongoose from "mongoose";

// Each document = one summarized past chat session
// These are the RAG "chunks" retrieved to give the AI memory across sessions

const ChatSummarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // The original session this summary came from
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },

    // Mood when this session happened (used to find mood-relevant past context)
    moodContext: {
      score: Number,
      label: String,
      detectedVia: String,
      recordedAt: Date,
    },

    // AI-generated summary of what was discussed
    summary: {
      type: String,
      required: true,
      maxlength: 2000,
    },

    // Key themes/topics extracted from the session (for smarter retrieval)
    themes: [{ type: String }],

    // How many messages were in the original session
    messageCount: { type: Number, default: 0 },

    // Date range of the session
    sessionStartedAt: Date,
    sessionEndedAt: Date,
  },
  { timestamps: true },
);

// Text index on summary + themes for MongoDB $text search retrieval
ChatSummarySchema.index({ summary: "text", themes: "text" });

// Index for fast user + date queries
ChatSummarySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("ChatSummary", ChatSummarySchema);
