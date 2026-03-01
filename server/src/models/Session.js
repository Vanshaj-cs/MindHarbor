import mongoose from "mongoose";
import crypto from "crypto";

const SessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tokenHash: { type: String, required: true, unique: true },
    deviceInfo: {
      userAgent: String,
      ip: String,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL auto-deletes expired sessions
    },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

SessionSchema.statics.hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

SessionSchema.statics.findByToken = function (rawToken) {
  return this.findOne({
    tokenHash: this.hashToken(rawToken),
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });
};

export default mongoose.model("Session", SessionSchema);
