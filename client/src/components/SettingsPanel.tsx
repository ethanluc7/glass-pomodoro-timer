import { useSettings } from "../context/SettingsContext";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

function NumberInput({ label, value, onChange, min = 1, max = 120, suffix = "min" }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[0.75rem] text-white/40 tracking-wide">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          className="settings-number-input bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-[0.8rem] text-center w-16 py-1.5 outline-none transition-all duration-300 focus:border-white/15"
          value={value}
          onChange={(e) => { const n = parseInt(e.target.value, 10); if (!isNaN(n) && n >= min && n <= max) onChange(n); }}
          min={min} max={max}
        />
        <span className="text-[0.65rem] text-white/25">{suffix}</span>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[0.75rem] text-white/40 tracking-wide">{label}</span>
      <button
        type="button"
        className={`w-10 h-5 rounded-full border-none cursor-pointer transition-all duration-300 relative ${checked ? "bg-white/20" : "bg-white/[0.06]"}`}
        onClick={() => onChange(!checked)}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${checked ? "left-[calc(100%-1.125rem)] bg-white/80" : "left-0.5 bg-white/25"}`} />
      </button>
    </div>
  );
}

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { settings, updateSettings } = useSettings();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 settings-backdrop" onClick={onClose} />

      <div className="relative settings-panel-enter">
        <div className="glass-card rounded-2xl p-8 w-[340px]">
          <div className="flex items-center justify-between mb-8 relative">
            <h2 className="text-[0.8rem] font-bold text-white/55 tracking-[0.2em] uppercase">Settings</h2>
            <button className="bg-transparent border-none text-white/30 hover:text-white/60 cursor-pointer transition-colors duration-300 text-lg leading-none" onClick={onClose}>&times;</button>
          </div>

          <div className="mb-6 relative">
            <p className="text-[0.6rem] text-white/25 tracking-[0.25em] uppercase font-semibold mb-3">Duration</p>
            <div className="flex flex-col gap-3">
              <NumberInput label="Focus" value={Math.round(settings.focusDuration / 60)} onChange={(v) => updateSettings({ focusDuration: v * 60 })} />
              <NumberInput label="Short Break" value={Math.round(settings.shortBreakDuration / 60)} onChange={(v) => updateSettings({ shortBreakDuration: v * 60 })} />
              <NumberInput label="Long Break" value={Math.round(settings.longBreakDuration / 60)} onChange={(v) => updateSettings({ longBreakDuration: v * 60 })} />
              <NumberInput label="Long Break Every" value={settings.longBreakInterval} onChange={(v) => updateSettings({ longBreakInterval: v })} min={2} max={10} suffix="sessions" />
            </div>
          </div>

          <div className="mb-6 relative">
            <p className="text-[0.6rem] text-white/25 tracking-[0.25em] uppercase font-semibold mb-3">Auto Start</p>
            <div className="flex flex-col gap-3">
              <Toggle label="Start Break Automatically" checked={settings.autoStartBreak} onChange={(v) => updateSettings({ autoStartBreak: v })} />
              <Toggle label="Start Focus Automatically" checked={settings.autoStartFocus} onChange={(v) => updateSettings({ autoStartFocus: v })} />
            </div>
          </div>

          <div className="relative">
            <p className="text-[0.6rem] text-white/25 tracking-[0.25em] uppercase font-semibold mb-3">Sound</p>
            <div className="flex flex-col gap-3">
              <Toggle label="Mute" checked={settings.muted} onChange={(v) => updateSettings({ muted: v })} />
              {!settings.muted && (
                <div className="flex items-center justify-between">
                  <span className="text-[0.75rem] text-white/40 tracking-wide">Volume</span>
                  <input type="range" className="settings-range w-28" min={0} max={1} step={0.05} value={settings.volume} onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
