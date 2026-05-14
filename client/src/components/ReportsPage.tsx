import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

interface Session {
  id: string;
  type: "focus" | "short-break" | "long-break";
  elapsed_seconds: number;
  started_at: string;
  duration: number;
}

interface DayStat {
  date: string;
  label: string;
  focusSeconds: number;
  sessionCount: number;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function getDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getLast7Days(): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(getDateStr(d));
  }
  return days;
}

export default function ReportsPage() {
  const { session: authSession } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    const token = authSession?.access_token;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    try {
      const res = await fetch("/api/sessions", { headers });
      if (res.ok) setSessions(await res.json());
    } catch { /* silently fail */ } finally { setLoading(false); }
  }, [authSession]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const last7 = getLast7Days();
  const dayMap = new Map<string, DayStat>();
  for (const dateStr of last7) {
    dayMap.set(dateStr, { date: dateStr, label: getDayLabel(dateStr), focusSeconds: 0, sessionCount: 0 });
  }

  let totalFocus = 0;
  let totalSessions = 0;

  for (const s of sessions) {
    if (s.type === "focus") {
      totalFocus += s.elapsed_seconds;
      totalSessions++;
      const dateStr = s.started_at.split("T")[0];
      const day = dayMap.get(dateStr);
      if (day) { day.focusSeconds += s.elapsed_seconds; day.sessionCount++; }
    }
  }

  const dayStats = last7.map((d) => dayMap.get(d)!);
  const maxFocus = Math.max(...dayStats.map((d) => d.focusSeconds), 1);
  const avgDaily = totalSessions > 0 ? totalFocus / 7 : 0;

  let streak = 0;
  for (let i = dayStats.length - 1; i >= 0; i--) {
    if (dayStats[i].focusSeconds > 0) streak++;
    else break;
  }

  const todayStr = getDateStr(new Date());
  const todayFocus = dayMap.get(todayStr)?.focusSeconds ?? 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[0.8rem] text-white/25 tracking-widest uppercase">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-6 mt-10">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-[480px] mb-8">
        <StatCard label="Today" value={formatTime(todayFocus)} />
        <StatCard label="Total Focus" value={formatTime(totalFocus)} />
        <StatCard label="Daily Avg" value={formatTime(avgDaily)} />
        <StatCard label="Streak" value={`${streak} day${streak !== 1 ? "s" : ""}`} />
      </div>

      {/* Chart */}
      <div className="w-full max-w-[480px] glass-card rounded-2xl p-6">
        <div className="relative">
          <h3 className="text-[0.65rem] text-white/25 tracking-[0.25em] uppercase font-semibold mb-5">
            Last 7 Days
          </h3>
          <svg viewBox="0 0 420 160" className="w-full" style={{ overflow: "visible" }}>
            {dayStats.map((day, i) => {
              const barWidth = 36;
              const gap = (420 - barWidth * 7) / 6;
              const x = i * (barWidth + gap);
              const barMaxHeight = 110;
              const barHeight = Math.max(2, (day.focusSeconds / maxFocus) * barMaxHeight);
              const y = barMaxHeight - barHeight + 10;
              return (
                <g key={day.date}>
                  <rect x={x} y={10} width={barWidth} height={barMaxHeight} rx={4} fill="rgba(255,255,255,0.03)" />
                  <rect className="reports-bar" x={x} y={y} width={barWidth} height={barHeight} rx={4} fill="var(--accent)" opacity={day.date === todayStr ? 0.7 : 0.35}>
                    <title>{`${day.label}: ${formatTime(day.focusSeconds)}`}</title>
                  </rect>
                  <text x={x + barWidth / 2} y={140} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="Syne, sans-serif">{day.label}</text>
                  {day.focusSeconds > 0 && (
                    <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize="8" fontFamily="Syne, sans-serif" className="reports-bar-label">{formatTime(day.focusSeconds)}</text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <p className="text-[0.7rem] text-white/18 mt-6 mb-10">
        {totalSessions} focus session{totalSessions !== 1 ? "s" : ""} total
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="relative">
        <p className="text-[0.6rem] text-white/25 tracking-[0.2em] uppercase font-semibold mb-1">{label}</p>
        <p className="timer-display text-[1.4rem] text-white/75 leading-none">{value}</p>
      </div>
    </div>
  );
}
