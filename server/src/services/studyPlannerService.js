import { GoogleGenAI } from "@google/genai";
import { addDays, format, parseISO } from "date-fns";
import { fetchImageAsBase64 } from "./cloudinaryService.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TIMEZONE = "Asia/Kolkata";

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN EXPORT: generate full study plan
//  If syllabusImageUrl is provided, Gemini receives it as an actual image part
//  so it can READ and EXTRACT text from the image itself.
//  syllabusText is used as fallback/supplement if image extraction is partial.
// ─────────────────────────────────────────────────────────────────────────────
export const generateStudyPlan = async ({
  syllabusText,
  syllabusImageUrl, // Cloudinary URL — we fetch this as base64 for Gemini
  totalDays,
  hoursPerDay,
  startDate,
}) => {
  const totalHours = totalDays * hoursPerDay;

  const textPart = {
    text: `You are an expert academic study planner.

${
  syllabusImageUrl
    ? "A syllabus image is attached above. Extract all topics and subtopics from it."
    : ""
}
${syllabusText ? `SYLLABUS TEXT:\n${syllabusText}` : ""}

CONSTRAINTS:
- Total days available: ${totalDays}
- Study hours per day: ${hoursPerDay} hours
- Total study hours: ${totalHours} hours
- Start date: ${startDate}
- Timezone: Asia/Kolkata

INSTRUCTIONS:
Distribute topics intelligently across ${totalDays} days. Group related topics. Allocate more time to harder topics. Include revision days.

Respond ONLY with a valid JSON object in this EXACT structure (no markdown, no explanation):
{
  "title": "Study Plan Title",
  "totalTopics": <number>,
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "topics": [
        {
          "topic": "Topic Name",
          "subtopics": ["subtopic1", "subtopic2"],
          "durationHours": <number>,
          "difficulty": "easy|medium|hard",
          "type": "new|revision|practice"
        }
      ],
      "totalHours": <number>,
      "focus": "One line summary of the day"
    }
  ],
  "revisionDays": [<day numbers>],
  "tips": ["study tip 1", "study tip 2"]
}`,
  };

  // ── Build contents array: [imagePart?, textPart] ───────────────────────────
  const contents = [];

  if (syllabusImageUrl) {
    try {
      const { base64, contentType } =
        await fetchImageAsBase64(syllabusImageUrl);
      // Gemini inline_data part — this is how Gemini actually sees the image
      contents.push({
        inlineData: {
          data: base64,
          mimeType: contentType,
        },
      });
    } catch (err) {
      console.warn(
        "[Planner] Could not fetch image for Gemini, falling back to text only:",
        err.message,
      );
    }
  }

  contents.push(textPart);

  // ── Call Gemini with image + text ─────────────────────────────────────────
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: contents }],
  });

  const rawText = response.text.trim();
  const jsonText = rawText
    .replace(/^```(?:json)?\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  let studyPlan;
  try {
    studyPlan = JSON.parse(jsonText);
  } catch {
    throw new Error("Failed to parse study plan JSON from Gemini response.");
  }

  const flowchartMermaid = generateMermaidFlowchart(studyPlan);
  const calendarEvents = generateCalendarEvents(
    studyPlan,
    startDate,
    hoursPerDay,
  );

  return { studyPlan, flowchartMermaid, calendarEvents };
};

// ─────────────────────────────────────────────────────────────────────────────
//  MERMAID FLOWCHART  (graph TD)
// ─────────────────────────────────────────────────────────────────────────────
const generateMermaidFlowchart = (studyPlan) => {
  const lines = ["graph TD"];

  lines.push("    classDef revision fill:#f9a825,stroke:#f57f17,color:#000");
  lines.push("    classDef hard fill:#e53935,stroke:#b71c1c,color:#fff");
  lines.push("    classDef medium fill:#1e88e5,stroke:#0d47a1,color:#fff");
  lines.push("    classDef easy fill:#43a047,stroke:#1b5e20,color:#fff");
  lines.push("    classDef start fill:#6a1b9a,stroke:#4a148c,color:#fff");
  lines.push("    classDef endd fill:#00695c,stroke:#004d40,color:#fff");
  lines.push("");
  lines.push(
    `    START([🎯 ${sanitize(studyPlan.title || "Study Plan")}]):::start`,
  );

  let prevId = "START";

  studyPlan.days.forEach((day) => {
    const dayId = `D${day.day}`;
    const isRevision = studyPlan.revisionDays?.includes(day.day);
    const dayLabel = `Day ${day.day} - ${sanitize(day.focus || `Day ${day.day}`)}`;
    const dayClass = isRevision ? ":::revision" : "";

    lines.push(`    ${prevId} --> ${dayId}["📅 ${dayLabel}"]${dayClass}`);

    day.topics.forEach((topic, idx) => {
      const tId = `D${day.day}T${idx}`;
      const icon =
        topic.type === "revision"
          ? "🔄"
          : topic.type === "practice"
            ? "✏️"
            : "📖";
      const label = `${icon} ${sanitize(topic.topic)} (${topic.durationHours}h)`;
      const cls = topic.difficulty || "medium";
      lines.push(`    ${dayId} --> ${tId}["${label}"]:::${cls}`);
    });

    prevId = dayId;
  });

  lines.push(`    ${prevId} --> END([✅ Study Complete!]):::endd`);
  return lines.join("\n");
};

const sanitize = (str) =>
  String(str)
    .replace(/"/g, "'")
    .replace(/[<>{}|]/g, "")
    .trim()
    .slice(0, 50);

// ─────────────────────────────────────────────────────────────────────────────
//  CALENDAR EVENTS  (RFC3339 with IST +05:30)
// ─────────────────────────────────────────────────────────────────────────────
const generateCalendarEvents = (studyPlan, startDate) => {
  const events = [];
  const base = parseISO(startDate);

  const difficultyColor = { easy: "2", medium: "7", hard: "11", revision: "5" };

  studyPlan.days.forEach((day) => {
    const dayDate = addDays(base, day.day - 1);
    const dateStr = format(dayDate, "yyyy-MM-dd");

    let currentHour = 9;
    let currentMinute = 0;

    day.topics.forEach((topic) => {
      const durationMinutes = Math.round(topic.durationHours * 60);
      const isRevision = studyPlan.revisionDays?.includes(day.day);
      const colorId = isRevision
        ? difficultyColor.revision
        : difficultyColor[topic.difficulty] || "7";

      const startDT = `${dateStr}T${pad(currentHour)}:${pad(currentMinute)}:00+05:30`;

      let endMinute = currentMinute + durationMinutes;
      let endHour = currentHour + Math.floor(endMinute / 60);
      endMinute = endMinute % 60;
      if (endHour >= 24) {
        endHour = 23;
        endMinute = 59;
      }

      const endDT = `${dateStr}T${pad(endHour)}:${pad(endMinute)}:00+05:30`;

      const subtopicsText = topic.subtopics?.length
        ? `\nSubtopics:\n• ${topic.subtopics.join("\n• ")}`
        : "";

      events.push({
        summary: `📚 ${topic.topic}`,
        description: `Day ${day.day} | ${cap(topic.type)} | ${cap(topic.difficulty)} difficulty | ${topic.durationHours}h${subtopicsText}\n\n${day.focus || ""}`,
        start: { dateTime: startDT, timeZone: TIMEZONE },
        end: { dateTime: endDT, timeZone: TIMEZONE },
        colorId,
        reminders: {
          useDefault: false,
          overrides: [{ method: "popup", minutes: 10 }],
        },
      });

      // Rolling time + 10 min break
      currentMinute += durationMinutes + 10;
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    });

    // All-day marker
    events.push({
      summary: `🗓️ Day ${day.day}: ${day.focus || "Study Session"}`,
      description: `Total: ${day.totalHours}h | Topics: ${day.topics.map((t) => t.topic).join(", ")}`,
      start: { date: dateStr },
      end: { date: dateStr },
      colorId: studyPlan.revisionDays?.includes(day.day) ? "5" : "9",
    });
  });

  return events;
};

const pad = (n) => String(n).padStart(2, "0");
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
