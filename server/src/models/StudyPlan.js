import mongoose from "mongoose";

const CalendarEventSchema = new mongoose.Schema(
  {
    summary: String,
    description: String,
    start: { dateTime: String, timeZone: String },
    end: { dateTime: String, timeZone: String },
    colorId: String,
  },
  { _id: false },
);

const StudyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Original inputs
    syllabusText: { type: String, default: "" },
    syllabusImage: { type: String }, // Cloudinary URL (optional)
    totalDays: { type: Number, required: true },
    hoursPerDay: { type: Number, required: true },
    startDate: { type: String, required: true }, // YYYY-MM-DD

    // Generated outputs
    studyPlan: { type: mongoose.Schema.Types.Mixed }, // structured JSON
    flowchartMermaid: { type: String }, // Mermaid graph TD code
    calendarEvents: [CalendarEventSchema],

    // Sync status
    syncedToCalendar: { type: Boolean, default: false },
    calendarEventIds: [{ type: String }], // Google Calendar event IDs after sync
    syncedAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("StudyPlan", StudyPlanSchema);
