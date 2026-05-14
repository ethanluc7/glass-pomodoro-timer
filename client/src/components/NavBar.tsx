import AccountMenu from "./AccountMenu";

interface NavBarProps {
  currentView: "timer" | "reports";
  onSettingsClick: () => void;
  onViewChange: (view: "timer" | "reports") => void;
}

export default function NavBar({ currentView, onSettingsClick, onViewChange }: NavBarProps) {
  return (
    <>
      <nav className="flex items-center justify-between max-w-[540px] mx-auto px-6 py-5">
        <h1
          className="text-[0.8rem] font-bold text-white/50 tracking-[0.3em] uppercase cursor-pointer hover:text-white/70 transition-colors duration-300"
          style={{ textShadow: "0 1px 6px rgba(0,0,0,0.3)" }}
          onClick={() => onViewChange("timer")}
        >
          Pomofocus
        </h1>

        <div className="flex items-center gap-2">
          {/* Reports */}
          <button
            className={`glass-pill rounded-lg p-2 border-none cursor-pointer transition-all duration-300 flex items-center justify-center ${
              currentView === "reports" ? "text-white/70" : "text-white/30 hover:text-white/60"
            }`}
            onClick={() => onViewChange(currentView === "reports" ? "timer" : "reports")}
            title="Reports"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="8" width="3" height="6" rx="0.5" />
              <rect x="6.5" y="4" width="3" height="10" rx="0.5" />
              <rect x="12" y="1" width="3" height="13" rx="0.5" />
            </svg>
          </button>

          {/* Settings */}
          <button
            className="glass-pill rounded-lg p-2 border-none text-white/30 hover:text-white/60 cursor-pointer transition-all duration-300 flex items-center justify-center"
            onClick={onSettingsClick}
            title="Settings"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="2.5" />
              <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.87 2.87l1.06 1.06M12.07 12.07l1.06 1.06M13.13 2.87l-1.06 1.06M3.93 12.07l-1.06 1.06" />
            </svg>
          </button>

          <AccountMenu />
        </div>
      </nav>

      <div className="max-w-[540px] mx-auto px-6">
        <div className="h-px bg-white/[0.06]" />
      </div>
    </>
  );
}
