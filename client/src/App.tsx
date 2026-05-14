import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./context/AuthContext";
import { useSettings } from "./context/SettingsContext";
import { useTasks } from "./context/TasksContext";
import AuthForm from "./components/AuthForm";
import NavBar from "./components/NavBar";
import SettingsPanel from "./components/SettingsPanel";
import SessionCounter from "./components/SessionCounter";
import TaskList from "./components/TaskList";
import ReportsPage from "./components/ReportsPage";
import { playAlarm } from "./lib/alarm";

type TimerMode = "focus" | "short-break" | "long-break";

const MODE_LABELS: Record<TimerMode, string> = {
  focus: "Pomodoro",
  "short-break": "Short Break",
  "long-break": "Long Break",
};

const MODE_MESSAGES: Record<TimerMode, string> = {
  focus: "Time to focus",
  "short-break": "Take a breath",
  "long-break": "Rest & recharge",
};

const MERGE_WINDOW_MS = 5 * 60 * 1000;

const RING_SIZE = 260;
const RING_STROKE = 2.5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function App() {
  const { user, session, loading } = useAuth();
  const { settings, getDuration } = useSettings();
  const { tasks, activeTaskId, incrementActiveTaskPomodoro } = useTasks();
  const containerRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<TimerMode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(() => getDuration("focus"));
  const [running, setRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [view, setView] = useState<"timer" | "reports">("timer");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const prevDurationRef = useRef(getDuration(mode));
  const completionHandled = useRef(false);

  // Session logging state
  const sessionStartTime = useRef<Date | null>(null);
  const currentSessionId = useRef<string | null>(null);
  const lastPauseAt = useRef<Date | null>(null);
  const totalElapsed = useRef(0);
  const sessionMode = useRef<TimerMode>(mode);
  const sessionStartedAt = useRef<Date | null>(null);

  const authHeaders = useCallback(() => {
    const token = session?.access_token;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, [session]);

  const logSession = useCallback(
    async (elapsed: number, startedAt: Date) => {
      if (elapsed <= 0) return;
      if (currentSessionId.current) {
        await fetch(`/api/sessions/${currentSessionId.current}`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ elapsed_seconds: elapsed }),
        });
      } else {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            duration: getDuration(sessionMode.current),
            elapsed_seconds: elapsed,
            type: sessionMode.current,
            started_at: startedAt.toISOString(),
            user_id: user?.id,
          }),
        });
        const data = await res.json();
        if (data?.id) currentSessionId.current = data.id;
      }
    },
    [authHeaders, user, getDuration]
  );

  const clearTracking = useCallback(() => {
    sessionStartTime.current = null;
    currentSessionId.current = null;
    lastPauseAt.current = null;
    totalElapsed.current = 0;
    sessionStartedAt.current = null;
  }, []);

  const flushAndClear = useCallback(async () => {
    if (sessionStartTime.current) {
      const segmentMs = Date.now() - sessionStartTime.current.getTime();
      totalElapsed.current += Math.round(segmentMs / 1000);
    }
    if (totalElapsed.current > 0 && sessionStartedAt.current) {
      await logSession(totalElapsed.current, sessionStartedAt.current);
    }
    clearTracking();
  }, [logSession, clearTracking]);

  const switchToMode = useCallback(
    (newMode: TimerMode) => {
      setMode(newMode);
      setSecondsLeft(getDuration(newMode));
      prevDurationRef.current = getDuration(newMode);
    },
    [getDuration]
  );

  const handleStart = useCallback(() => {
    const now = new Date();
    const withinMergeWindow =
      lastPauseAt.current &&
      now.getTime() - lastPauseAt.current.getTime() < MERGE_WINDOW_MS &&
      sessionMode.current === mode;
    if (!withinMergeWindow) {
      currentSessionId.current = null;
      totalElapsed.current = 0;
      sessionStartedAt.current = now;
      sessionMode.current = mode;
    }
    sessionStartTime.current = now;
    if (!sessionStartedAt.current) sessionStartedAt.current = now;
    completionHandled.current = false;
    setRunning(true);
  }, [mode]);

  const handlePause = useCallback(async () => {
    setRunning(false);
    if (sessionStartTime.current) {
      const segmentMs = Date.now() - sessionStartTime.current.getTime();
      totalElapsed.current += Math.round(segmentMs / 1000);
    }
    if (totalElapsed.current > 0 && sessionStartedAt.current) {
      await logSession(totalElapsed.current, sessionStartedAt.current);
    }
    lastPauseAt.current = new Date();
    sessionStartTime.current = null;
  }, [logSession]);

  const reset = useCallback(
    async (newMode?: TimerMode) => {
      await flushAndClear();
      const m = newMode ?? mode;
      switchToMode(m);
      setRunning(false);
    },
    [mode, flushAndClear, switchToMode]
  );

  // Countdown
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { setRunning(false); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  // Timer completion
  useEffect(() => {
    if (secondsLeft !== 0 || running || completionHandled.current) return;
    completionHandled.current = true;

    if (sessionStartTime.current) {
      const segmentMs = Date.now() - sessionStartTime.current.getTime();
      totalElapsed.current += Math.round(segmentMs / 1000);
    }
    if (totalElapsed.current > 0 && sessionStartedAt.current) {
      logSession(totalElapsed.current, sessionStartedAt.current);
    }
    clearTracking();

    if (!settings.muted) playAlarm(settings.volume);

    if (mode === "focus") {
      incrementActiveTaskPomodoro();
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);
      if (newCount >= settings.longBreakInterval) {
        switchToMode("long-break");
        setCompletedPomodoros(0);
      } else {
        switchToMode("short-break");
      }
      if (settings.autoStartBreak) {
        setTimeout(() => { completionHandled.current = false; setRunning(true); }, 500);
      }
    } else {
      switchToMode("focus");
      if (settings.autoStartFocus) {
        setTimeout(() => { completionHandled.current = false; setRunning(true); }, 500);
      }
    }
  }, [secondsLeft, running, mode, completedPomodoros, settings, logSession, clearTracking, incrementActiveTaskPomodoro, switchToMode]);

  // Sync duration when settings change while idle
  useEffect(() => {
    const currentDuration = getDuration(mode);
    if (!running && secondsLeft === prevDurationRef.current) {
      setSecondsLeft(currentDuration);
    }
    prevDurationRef.current = currentDuration;
  }, [getDuration, mode, running, secondsLeft]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full p-6" ref={containerRef}>
        <p className="text-sm text-white/30 tracking-widest uppercase">Loading</p>
      </div>
    );
  }

  if (!user) return <AuthForm />;

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");
  const progress = RING_CIRCUMFERENCE * (1 - secondsLeft / getDuration(mode));
  const activeTask = tasks.find((t) => t.id === activeTaskId && !t.done);

  return (
    <div ref={containerRef} className="relative min-h-screen w-full" data-mode={mode}>
      <NavBar
        currentView={view}
        onSettingsClick={() => setSettingsOpen(true)}
        onViewChange={setView}
      />

      {view === "timer" ? (
        <div className="flex flex-col items-center px-6 mt-12">
          {/* Mode tabs */}
          <div className="flex gap-2 mb-8 fade-in">
            {(["focus", "short-break", "long-break"] as TimerMode[]).map((m) => (
              <button
                key={m}
                className={`glass-pill px-5 py-2 rounded-xl text-[0.8rem] font-semibold border-none cursor-pointer whitespace-nowrap tracking-wide transition-all duration-300 ${
                  mode === m
                    ? "text-white tab-active"
                    : "text-white/60 hover:text-white/90"
                }`}
                onClick={() => reset(m)}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          {/* Session counter */}
          <div className="fade-in fade-in-delay-1">
            <SessionCounter completed={completedPomodoros} total={settings.longBreakInterval} />
          </div>

          {/* Active task label */}
          {activeTask && (
            <p className="text-[0.75rem] text-white/40 tracking-wide mt-1 mb-3 max-w-[260px] truncate text-center fade-in fade-in-delay-1">
              {activeTask.title}
            </p>
          )}

          {/* Timer */}
          <div className="glass-card rounded-full mt-2 fade-in fade-in-delay-2" style={{ width: RING_SIZE, height: RING_SIZE }}>
            <div className="relative flex items-center justify-center w-full h-full">
              {/* SVG Progress Ring */}
              <svg
                className={`progress-ring absolute inset-0 ${running ? "progress-ring--running" : ""}`}
                width={RING_SIZE}
                height={RING_SIZE}
              >
                <circle className="progress-ring__track" cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} strokeWidth={RING_STROKE} />
                <circle className="progress-ring__fill" cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} strokeWidth={RING_STROKE} strokeDasharray={RING_CIRCUMFERENCE} strokeDashoffset={progress} />
              </svg>

              {/* Timer digits */}
              <div className="flex flex-col items-center select-none relative">
                <div className="timer-display text-[5rem] text-white leading-none" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
                  {mins}:{secs}
                </div>
                <div className="mt-2 h-1.5 flex items-center justify-center">
                  {running && (
                    <div className="running-indicator w-1 h-1 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Start / Pause */}
          <button
            className="glass-pill btn-glow mt-8 px-12 py-3.5 rounded-xl border-none text-white/90 text-[0.8rem] font-bold tracking-[0.3em] uppercase cursor-pointer transition-all duration-300 fade-in fade-in-delay-3"
            onClick={running ? handlePause : handleStart}
          >
            {running ? "PAUSE" : "START"}
          </button>

          {/* Mode message */}
          <p className="mode-message text-[0.8rem] text-white/30 font-medium mt-6 tracking-wide fade-in fade-in-delay-4">
            {MODE_MESSAGES[mode]}
          </p>

          {/* Reset */}
          {(running || secondsLeft < getDuration(mode)) && (
            <div className="mt-3 fade-in">
              <button
                className="bg-transparent border border-white/[0.08] text-white/30 hover:text-white/60 hover:border-white/20 transition-all duration-300 cursor-pointer text-[0.7rem] font-semibold px-6 py-2 rounded-lg tracking-wider uppercase"
                onClick={() => reset()}
              >
                Reset
              </button>
            </div>
          )}

          {/* Task list */}
          <div className="fade-in fade-in-delay-5 w-full flex justify-center">
            <TaskList />
          </div>
        </div>
      ) : (
        <ReportsPage />
      )}

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
