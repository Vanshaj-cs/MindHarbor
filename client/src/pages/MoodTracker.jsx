import { useState, useEffect } from "react";
import CameraDetection from "../components/mood/CameraDetection";
import EmotionResult from "../components/mood/EmotionResult";
import MoodHistory from "../components/mood/MoodHistory";
import WeeklyTrend from "../components/mood/WeeklyTrend";
import MoodButtons from "../components/mood/MoodButtons";
import RecentActivity from "../components/mood/RecentActivity";
import { moodService } from "../services/moodService";

const emojiMap = {
  Happy: "😊",
  Calm: "😌",
  Loved: "🥰",
  Neutral: "😐",
  Sad: "😔",
  Anxious: "😰",
  Angry: "😡",
  Tired: "😴",
  Surprise: "😲",
  Fear: "😨",
  Disgust: "🤢",
};

const MoodTracker = () => {
  const [detectionResult, setDetectionResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial mood data from API
  useEffect(() => {
    const fetchMoods = async () => {
      try {
        const response = await moodService.getMoods();
        setLogs(response.data.data || []);
      } catch (err) {
        console.error("Failed to fetch moods:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMoods();
  }, []);

  const handleLog = async (moodData) => {
    try {
      // Save mood to database using proper structure from mood.model.js
      const moodPayload = {
        value: moodData.value,
        label: moodData.label,
        notes: moodData.notes || "",
        capturedVia: moodData.capturedVia || "manual",
      };

      const saved = await moodService.saveMood(moodPayload);

      // Update logs with the saved mood
      setLogs((prev) => [saved.data, ...prev]);

      // Dispatch custom event to notify Topbar
      window.dispatchEvent(
        new CustomEvent("moodUpdated", { detail: saved.data }),
      );
    } catch (err) {
      console.error("Failed to save mood:", err);
    }
  };

  const handleCameraDetection = (data) => {
    // Camera detection already saved to DB via analyzeMood
    // Just update UI with the returned data
    const emotionLabels = [
      "Angry",
      "Disgust",
      "Fear",
      "Happy",
      "Neutral",
      "Sad",
      "Surprise",
    ];

    // Create mood object from API response
    const moodEntry = {
      _id: data.id,
      value: data.mood,
      label: data.moodLabel,
      capturedVia: "ai",
      createdAt: data.createdAt,
    };

    // Update logs
    setLogs((prev) => [moodEntry, ...prev]);

    // Show detection result
    setDetectionResult({
      label: data.moodLabel,
      value: data.mood,
      confidence: data.confidence,
    });

    // Dispatch custom event to notify Topbar
    window.dispatchEvent(new CustomEvent("moodUpdated", { detail: moodEntry }));
  };

  return (
    <div className="bg-background min-h-screen">
      <section className="gradient-hero px-8 py-14">
        <h1 className="text-4xl font-bold text-text-primary tracking-tight">
          Dashboard
        </h1>
        <p className="text-text-secondary mt-2">
          Tracking emotional data to MongoDB Atlas
        </p>
      </section>

      <div className="content-contained space-y-10 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 bg-surface p-6 rounded-3xl border border-forest-800/20 shadow-sm">
            {/* Camera Detection */}
            <CameraDetection onDetect={handleCameraDetection} />

            <div className="mt-8 pt-8 border-t border-forest-800/20">
              <MoodButtons
                onLog={(data) => {
                  const emotionLabels = [
                    "Angry",
                    "Disgust",
                    "Fear",
                    "Happy",
                    "Neutral",
                    "Sad",
                    "Surprise",
                  ];
                  const value = emotionLabels.findIndex(
                    (e) => e === data.mood.label,
                  );
                  handleLog({
                    value: value !== -1 ? value : 4,
                    label: data.mood.label,
                    notes: data.note || "",
                    capturedVia: "manual",
                  });
                }}
              />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <EmotionResult result={detectionResult} />
            <RecentActivity logs={logs} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <MoodHistory logs={logs} />
          </div>
          <div className="lg:col-span-7">
            <WeeklyTrend logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodTracker;
