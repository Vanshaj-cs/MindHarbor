import { useState, useEffect, useRef, useCallback } from "react";
import {
  CalendarDays,
  Upload,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  GitBranch,
  BookOpen,
  Clock,
  ListChecks,
  X,
  Link2,
  CalendarCheck,
  Trash2,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Plus,
} from "lucide-react";
import { plannerService } from "../services/plannerService";

// ── Difficulty badge colors ────────────────────────────────────────────────────
const difficultyStyle = {
  easy: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  medium: "bg-blue-500/15   text-blue-300   border-blue-500/20",
  hard: "bg-red-500/15    text-red-300    border-red-500/20",
  revision: "bg-yellow-500/15 text-yellow-300 border-yellow-500/20",
};

const typeIcon = { new: "📖", revision: "🔄", practice: "✏️" };

// ── Mermaid renderer ──────────────────────────────────────────────────────────
const MermaidChart = ({ code }) => {
  const ref = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code || !ref.current) return;
    setError(false);

    const render = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            background: "#0f1f17",
            primaryColor: "#1a3a2a",
            primaryTextColor: "#d1fae5",
            edgeLabelBackground: "#0f1f17",
            lineColor: "#4ade80",
            secondaryColor: "#0f2a1a",
            tertiaryColor: "#1a3a2a",
          },
        });

        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);
        if (ref.current) ref.current.innerHTML = svg;
      } catch (err) {
        console.error("Mermaid render error:", err);
        setError(true);
      }
    };

    render();
  }, [code]);

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-text-muted text-sm">
        <AlertCircle size={16} className="mr-2 text-red-400" />
        Could not render flowchart. The Mermaid code is still available to copy.
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="w-full overflow-auto flex justify-center p-4"
      style={{ minHeight: 200 }}
    />
  );
};

// ── Day card in plan view ─────────────────────────────────────────────────────
const DayCard = ({ day, isRevision }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-2xl border transition-all duration-200
      ${
        isRevision
          ? "border-yellow-500/20 bg-yellow-500/5"
          : "border-forest-700/30 bg-surface-card/30"
      }`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <span className="w-8 h-8 rounded-xl bg-forest-800/60 flex items-center justify-center text-xs font-bold text-emerald-300 shrink-0">
          {day.day}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {isRevision ? "🔄 " : ""}
            {day.focus || `Day ${day.day}`}
          </p>
          <p className="text-xs text-text-muted">
            {day.date} · {day.totalHours}h · {day.topics.length} topic
            {day.topics.length !== 1 ? "s" : ""}
          </p>
        </div>
        {open ? (
          <ChevronUp size={15} className="text-text-muted shrink-0" />
        ) : (
          <ChevronDown size={15} className="text-text-muted shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-forest-700/20 pt-3">
          {day.topics.map((topic, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-surface-card/40"
            >
              <span className="text-base mt-0.5">
                {typeIcon[topic.type] || "📖"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-text-primary">
                    {topic.topic}
                  </p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${difficultyStyle[topic.difficulty] || difficultyStyle.medium}`}
                  >
                    {topic.difficulty}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {topic.durationHours}h
                  </span>
                </div>
                {topic.subtopics?.length > 0 && (
                  <p className="text-xs text-text-muted mt-1">
                    {topic.subtopics.join(" · ")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Google Calendar connection banner ─────────────────────────────────────────
const CalendarBanner = ({ connected, onConnect, loading }) => {
  if (connected) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <CalendarCheck size={14} className="text-emerald-400" />
        <span className="text-xs text-emerald-300 font-medium">
          Google Calendar connected
        </span>
      </div>
    );
  }
  return (
    <button
      onClick={onConnect}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 rounded-xl
        bg-surface-card border border-forest-700/40 hover:border-forest-600
        text-xs font-medium text-text-secondary hover:text-text-primary
        transition-all duration-200"
    >
      <Link2 size={13} className="text-text-muted" />
      Connect Google Calendar
    </button>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const StudyPlanner = () => {
  // Generate form
  const [syllabusText, setSyllabusText] = useState("");
  const [syllabusFile, setSyllabusFile] = useState(null);
  const [totalDays, setTotalDays] = useState("10");
  const [hoursPerDay, setHoursPerDay] = useState("4");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });

  // State
  const [generating, setGenerating] = useState(false);
  const [activePlan, setActivePlan] = useState(null); // currently shown plan
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [activeTab, setActiveTab] = useState("plan"); // 'plan' | 'flowchart' | 'events'
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [checkingGoogle, setCheckingGoogle] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileRef = useRef(null);

  // ── Load plans + Google status on mount ────────────────────────────────────
  const loadPlans = useCallback(async () => {
    try {
      const res = await plannerService.getPlans();
      setPlans(res.data || []);
    } catch (err) {
      console.error("Failed to load plans:", err.message);
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
    plannerService
      .getGoogleStatus()
      .then((res) => setGoogleConnected(res.data?.connected || false))
      .catch(() => setGoogleConnected(false))
      .finally(() => setCheckingGoogle(false));
  }, [loadPlans]);

  // ── Generate plan ──────────────────────────────────────────────────────────
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!syllabusText.trim() && !syllabusFile) {
      setError("Please provide syllabus text or upload an image.");
      return;
    }

    setGenerating(true);
    setError("");
    setSuccess("");
    setSyncResult(null);

    try {
      const fd = new FormData();
      fd.append("totalDays", totalDays);
      fd.append("hoursPerDay", hoursPerDay);
      fd.append("startDate", startDate);
      if (syllabusText.trim()) fd.append("syllabusText", syllabusText.trim());
      if (syllabusFile) fd.append("syllabusImage", syllabusFile);

      const res = await plannerService.generatePlan(fd);
      const data = res.data;

      setActivePlan(data);
      setActiveTab("plan");
      setSuccess("Study plan generated!");
      await loadPlans();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // ── Load a saved plan from sidebar ─────────────────────────────────────────
  const handleLoadPlan = async (planId) => {
    setError("");
    setSyncResult(null);
    try {
      const res = await plannerService.getPlan(planId);
      setActivePlan(res.data);
      setActiveTab("plan");
    } catch (err) {
      setError("Failed to load plan.");
    }
  };

  // ── Sync to Google Calendar ─────────────────────────────────────────────────
  const handleSync = async () => {
    if (!activePlan?.planId && !activePlan?._id) return;
    const planId = activePlan.planId || activePlan._id;

    setSyncing(true);
    setError("");
    setSyncResult(null);
    try {
      const res = await plannerService.syncToCalendar(planId);
      setSyncResult(res.data);
      setSuccess(`${res.data.insertedCount} events added to Google Calendar!`);
      await loadPlans();
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  // ── File drag & drop ────────────────────────────────────────────────────────
  const [dragging, setDragging] = useState(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setSyllabusFile(file);
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const plan = activePlan?.studyPlan;
  const mermaidCode = activePlan?.flowchartMermaid;
  const calEvents = activePlan?.calendarEvents;
  const isSynced = activePlan?.syncedToCalendar;
  const planId = activePlan?.planId || activePlan?._id;
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <section className="gradient-hero px-5 lg:px-8 pt-10 pb-14 lg:pt-14 lg:pb-16">
        <div className="max-w-5xl">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-emerald-400" />
                <span className="section-label text-emerald-400">
                  AI-Powered
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary tracking-tight leading-tight">
                Study Planner
              </h1>
              <p className="text-base text-text-secondary mt-3 max-w-lg leading-relaxed">
                Upload your syllabus, set your timeline, and let AI build a
                personalised study plan — complete with a visual flowchart and
                Google Calendar sync.
              </p>
            </div>

            {/* Google Calendar status */}
            {!checkingGoogle && (
              <CalendarBanner
                connected={googleConnected}
                onConnect={plannerService.connectGoogle}
                loading={checkingGoogle}
              />
            )}
          </div>
        </div>
      </section>

      <div className="content-contained py-10 space-y-10">
        {/* ── Global alerts ──────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-in">
            <AlertCircle size={15} className="text-red-400 shrink-0" />
            <p className="text-sm text-red-300 flex-1">{error}</p>
            <button onClick={() => setError("")}>
              <X size={14} className="text-red-400" />
            </button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-fade-in">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-300 flex-1">{success}</p>
            <button onClick={() => setSuccess("")}>
              <X size={14} className="text-emerald-400" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* ── Left column: form + past plans ─────────────────────────── */}
          <div className="lg:col-span-4 space-y-8">
            {/* Generate form */}
            <div>
              <p className="section-label text-text-muted mb-1">Generate</p>
              <h3 className="text-lg font-semibold text-text-primary mb-5">
                New Study Plan
              </h3>

              <form onSubmit={handleGenerate} className="space-y-4">
                {/* Syllabus text */}
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1.5">
                    Syllabus text{" "}
                    <span className="text-text-muted">
                      (optional if image given)
                    </span>
                  </label>
                  <textarea
                    rows={4}
                    value={syllabusText}
                    onChange={(e) => setSyllabusText(e.target.value)}
                    placeholder="Paste your syllabus topics here…&#10;e.g. Unit 1: Newton's Laws, Kinematics&#10;     Unit 2: Thermodynamics..."
                    className="w-full px-3.5 py-2.5 bg-surface-card rounded-xl resize-none
                      text-sm text-text-primary placeholder:text-text-muted
                      border border-forest-700/40 focus:border-forest-600
                      focus:outline-none focus:ring-2 focus:ring-forest-600/30
                      transition-all duration-200"
                  />
                </div>

                {/* Image drop zone */}
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1.5">
                    Syllabus image / PDF{" "}
                    <span className="text-text-muted">(optional)</span>
                  </label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl
                      border-2 border-dashed cursor-pointer transition-all duration-200
                      ${dragging ? "border-emerald-500/50 bg-emerald-500/5" : "border-forest-700/40 hover:border-forest-600 bg-surface-card/30"}`}
                  >
                    {syllabusFile ? (
                      <div className="flex items-center gap-2 text-sm text-emerald-300">
                        {syllabusFile.type.includes("pdf") ? (
                          <FileText size={16} />
                        ) : (
                          <ImageIcon size={16} />
                        )}
                        <span className="truncate max-w-[180px]">
                          {syllabusFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSyllabusFile(null);
                          }}
                          className="text-text-muted hover:text-red-400 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload size={18} className="text-text-muted" />
                        <p className="text-xs text-text-muted text-center">
                          Drop image or PDF here
                          <br />
                          or click to browse
                        </p>
                      </>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) =>
                        setSyllabusFile(e.target.files[0] || null)
                      }
                    />
                  </div>
                </div>

                {/* Days + Hours */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1.5">
                      Total days
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={totalDays}
                      onChange={(e) => setTotalDays(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-card rounded-xl
                        text-sm text-text-primary border border-forest-700/40
                        focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/30
                        transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-secondary block mb-1.5">
                      Hours / day
                    </label>
                    <input
                      type="number"
                      min={0.5}
                      max={16}
                      step={0.5}
                      value={hoursPerDay}
                      onChange={(e) => setHoursPerDay(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-card rounded-xl
                        text-sm text-text-primary border border-forest-700/40
                        focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/30
                        transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Start date */}
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1.5">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    min={todayStr}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-card rounded-xl
                      text-sm text-text-primary border border-forest-700/40
                      focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/30
                      transition-all duration-200
                      [color-scheme:dark]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                    bg-forest-700 hover:bg-forest-600 text-white font-medium text-sm
                    shadow-sm shadow-forest-900 transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Generating
                      plan…
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> Generate Plan
                    </>
                  )}
                </button>

                {generating && (
                  <p className="text-xs text-text-muted text-center animate-pulse">
                    AI is reading your syllabus and building your plan…
                  </p>
                )}
              </form>
            </div>

            {/* Past plans */}
            {!loadingPlans && plans.length > 0 && (
              <div>
                <div className="section-rule mb-5" />
                <p className="section-label text-text-muted mb-1">History</p>
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Past Plans
                </h3>
                <div className="space-y-2">
                  {plans.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => handleLoadPlan(p._id)}
                      className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left
                        transition-all duration-200
                        ${
                          activePlan?._id === p._id ||
                          activePlan?.planId === p._id
                            ? "bg-forest-800/50 border border-forest-700/40"
                            : "hover:bg-surface-hover/50 border border-transparent"
                        }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <BookOpen size={14} className="text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {p.studyPlan?.title || "Study Plan"}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {p.totalDays}d · {p.hoursPerDay}h/day
                          {p.syncedToCalendar && (
                            <span className="ml-2 text-emerald-400">
                              ✓ Synced
                            </span>
                          )}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right column: plan viewer ──────────────────────────────── */}
          <div className="lg:col-span-8">
            {!activePlan ? (
              /* Empty state */
              <div
                className="flex flex-col items-center justify-center h-full min-h-[400px]
                rounded-2xl border border-dashed border-forest-700/30 bg-surface-card/20"
              >
                <div
                  className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/15
                  flex items-center justify-center mb-4"
                >
                  <CalendarDays size={24} className="text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-1">
                  No plan yet
                </h3>
                <p className="text-sm text-text-muted text-center max-w-xs">
                  Fill in the form and click "Generate Plan" to create your
                  personalised study schedule.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Plan header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">
                      {plan?.title || "Study Plan"}
                    </h2>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1.5 text-xs text-text-muted">
                        <ListChecks size={12} /> {plan?.totalTopics || "—"}{" "}
                        topics
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-text-muted">
                        <Clock size={12} /> {plan?.days?.length || "—"} days
                      </span>
                      {plan?.revisionDays?.length > 0 && (
                        <span className="flex items-center gap-1.5 text-xs text-text-muted">
                          <RefreshCw size={12} /> {plan.revisionDays.length}{" "}
                          revision days
                        </span>
                      )}
                      {isSynced && (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                          <CalendarCheck size={12} /> Synced to Google Calendar
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Calendar sync button */}
                  <div className="flex gap-2 flex-wrap">
                    {!googleConnected ? (
                      <button
                        onClick={plannerService.connectGoogle}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl
                          bg-surface-card border border-forest-700/40 hover:border-forest-600
                          text-sm text-text-secondary hover:text-text-primary
                          transition-all duration-200"
                      >
                        <Link2 size={14} /> Connect Calendar
                      </button>
                    ) : (
                      <button
                        onClick={handleSync}
                        disabled={syncing || !planId}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl
                          bg-emerald-600/20 border border-emerald-500/30
                          hover:bg-emerald-600/30 text-emerald-300
                          text-sm font-medium transition-all duration-200
                          disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {syncing ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />{" "}
                            Syncing…
                          </>
                        ) : isSynced ? (
                          <>
                            <RefreshCw size={14} /> Re-sync to Calendar
                          </>
                        ) : (
                          <>
                            <Calendar size={14} /> Add to Google Calendar
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Sync result */}
                {syncResult && (
                  <div className="p-4 rounded-2xl bg-emerald-500/8 border border-emerald-500/20 animate-fade-in">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarCheck size={15} className="text-emerald-400" />
                      <p className="text-sm font-medium text-emerald-300">
                        Calendar sync complete
                      </p>
                    </div>
                    <div className="flex gap-4 text-xs text-text-muted">
                      <span className="text-emerald-400">
                        ✓ {syncResult.insertedCount} events added
                      </span>
                      {syncResult.failedCount > 0 && (
                        <span className="text-red-400">
                          ✗ {syncResult.failedCount} failed
                        </span>
                      )}
                    </div>
                    {syncResult.calendarLink && (
                      <a
                        href={syncResult.calendarLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 text-xs text-emerald-400 hover:underline"
                      >
                        Open Google Calendar →
                      </a>
                    )}
                  </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-surface-card/50 rounded-2xl w-fit">
                  {[
                    { id: "plan", label: "Day-by-Day", icon: CalendarDays },
                    { id: "flowchart", label: "Flowchart", icon: GitBranch },
                    { id: "events", label: "Events", icon: Clock },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                        transition-all duration-200
                        ${
                          activeTab === tab.id
                            ? "bg-forest-700 text-white shadow-sm"
                            : "text-text-muted hover:text-text-primary"
                        }`}
                    >
                      <tab.icon size={14} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* ── Day-by-Day tab ─────────────────────────────────── */}
                {activeTab === "plan" && plan?.days && (
                  <div className="space-y-2">
                    {/* Tips */}
                    {plan.tips?.length > 0 && (
                      <div className="p-4 rounded-2xl bg-surface-card/30 border border-forest-700/20 mb-4">
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                          💡 Study Tips
                        </p>
                        <ul className="space-y-1">
                          {plan.tips.map((tip, i) => (
                            <li
                              key={i}
                              className="text-xs text-text-muted flex items-start gap-2"
                            >
                              <span className="text-emerald-400 mt-0.5">•</span>{" "}
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {plan.days.map((day) => (
                      <DayCard
                        key={day.day}
                        day={day}
                        isRevision={plan.revisionDays?.includes(day.day)}
                      />
                    ))}
                  </div>
                )}

                {/* ── Flowchart tab ──────────────────────────────────── */}
                {activeTab === "flowchart" && (
                  <div className="rounded-2xl border border-forest-700/30 bg-surface-card/30 overflow-hidden">
                    {mermaidCode ? (
                      <>
                        <div className="px-4 py-3 border-b border-forest-700/20 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GitBranch size={14} className="text-emerald-400" />
                            <span className="text-xs font-medium text-text-secondary">
                              AI-generated flowchart
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(mermaidCode)
                            }
                            className="text-xs text-text-muted hover:text-text-primary
                              px-2 py-1 rounded-lg hover:bg-surface-hover transition-all"
                          >
                            Copy Mermaid code
                          </button>
                        </div>
                        <MermaidChart code={mermaidCode} />
                      </>
                    ) : (
                      <p className="text-center text-text-muted text-sm p-8">
                        No flowchart available for this plan.
                      </p>
                    )}
                  </div>
                )}

                {/* ── Calendar events tab ────────────────────────────── */}
                {activeTab === "events" && (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {calEvents?.length > 0 ? (
                      calEvents
                        .filter((ev) => ev.start?.dateTime) // skip all-day markers
                        .map((ev, i) => {
                          const start = new Date(ev.start.dateTime);
                          const end = new Date(ev.end.dateTime);
                          return (
                            <div
                              key={i}
                              className="flex items-start gap-3 p-3 rounded-xl
                                bg-surface-card/30 border border-forest-700/20"
                            >
                              <div className="w-10 h-10 rounded-xl bg-forest-800/60 flex flex-col items-center justify-center shrink-0">
                                <span className="text-[10px] text-text-muted leading-none">
                                  {start.toLocaleDateString("en-IN", {
                                    month: "short",
                                  })}
                                </span>
                                <span className="text-sm font-bold text-emerald-300 leading-none">
                                  {start.getDate()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-primary truncate">
                                  {ev.summary?.replace("📚 ", "")}
                                </p>
                                <p className="text-xs text-text-muted mt-0.5">
                                  {start.toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                  {" → "}
                                  {end.toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <p className="text-center text-text-muted text-sm p-8">
                        No events available.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyPlanner;
