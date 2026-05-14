interface SessionCounterProps {
  completed: number;
  total: number;
}

export default function SessionCounter({ completed, total }: SessionCounterProps) {
  return (
    <div className="flex items-center gap-2 mb-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-all duration-500 ${
            i < completed
              ? "session-dot--filled"
              : i === completed
                ? "session-dot--current"
                : "session-dot--empty"
          }`}
        />
      ))}
    </div>
  );
}
