import { useState } from "react";
import { useTasks, type Task } from "../context/TasksContext";

interface TaskItemProps {
  task: Task;
  index: number;
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
}

export default function TaskItem({ task, index, isActive, isFirst, isLast }: TaskItemProps) {
  const { updateTask, deleteTask, toggleDone, setActiveTask, reorderTask } = useTasks();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editEst, setEditEst] = useState(task.estimatedPomodoros);

  const saveEdit = () => {
    if (editTitle.trim()) {
      updateTask(task.id, { title: editTitle.trim(), estimatedPomodoros: editEst });
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-2 py-3 px-3 rounded-lg bg-white/[0.02]">
        <input
          className="bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-[0.8rem] px-3 py-2 outline-none focus:border-white/15 transition-all duration-300"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && saveEdit()}
          autoFocus
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[0.65rem] text-white/20">Est. pomodoros:</span>
            <input
              type="number"
              className="bg-white/[0.04] border border-white/[0.08] rounded-md text-white text-[0.75rem] text-center w-12 py-1 outline-none focus:border-white/15"
              value={editEst}
              onChange={(e) => setEditEst(Math.max(1, parseInt(e.target.value, 10) || 1))}
              min={1}
              max={20}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              className="bg-transparent border-none text-white/30 hover:text-white/60 cursor-pointer text-[0.65rem] tracking-wide transition-colors duration-300"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
            <button
              className="bg-transparent border-none text-white/50 hover:text-white/80 cursor-pointer text-[0.65rem] font-semibold tracking-wide transition-colors duration-300"
              onClick={saveEdit}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-300 ${
        isActive ? "task-item--active" : "hover:bg-white/[0.02]"
      } ${task.done ? "opacity-40" : ""}`}
    >
      {/* Checkbox */}
      <button
        className={`task-checkbox flex-shrink-0 w-4 h-4 rounded-full border cursor-pointer transition-all duration-300 ${
          task.done
            ? "bg-white/20 border-white/20"
            : "bg-transparent border-white/15 hover:border-white/30"
        }`}
        onClick={() => toggleDone(task.id)}
      >
        {task.done && (
          <svg width="10" height="10" viewBox="0 0 10 10" className="mx-auto">
            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Title */}
      <span
        className={`flex-1 text-[0.8rem] text-white/60 truncate ${
          task.done ? "line-through" : ""
        }`}
      >
        {task.title}
      </span>

      {/* Pomodoro count */}
      <span className="text-[0.65rem] text-white/20 font-medium tabular-nums flex-shrink-0">
        {task.completedPomodoros}/{task.estimatedPomodoros}
      </span>

      {/* Actions (visible on hover) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {!task.done && (
          <button
            className={`bg-transparent border-none cursor-pointer text-[0.6rem] tracking-wide transition-colors duration-300 px-1 ${
              isActive ? "text-white/50" : "text-white/20 hover:text-white/50"
            }`}
            onClick={() => setActiveTask(isActive ? null : task.id)}
            title={isActive ? "Unset active" : "Set as active"}
          >
            {isActive ? "active" : "focus"}
          </button>
        )}
        {!isFirst && (
          <button
            className="bg-transparent border-none text-white/15 hover:text-white/40 cursor-pointer transition-colors duration-300 text-[0.7rem] px-0.5"
            onClick={() => reorderTask(index, index - 1)}
            title="Move up"
          >
            ▲
          </button>
        )}
        {!isLast && (
          <button
            className="bg-transparent border-none text-white/15 hover:text-white/40 cursor-pointer transition-colors duration-300 text-[0.7rem] px-0.5"
            onClick={() => reorderTask(index, index + 1)}
            title="Move down"
          >
            ▼
          </button>
        )}
        <button
          className="bg-transparent border-none text-white/15 hover:text-white/40 cursor-pointer transition-colors duration-300 text-[0.7rem] px-0.5"
          onClick={() => setEditing(true)}
          title="Edit"
        >
          ✎
        </button>
        <button
          className="bg-transparent border-none text-white/15 hover:text-red-400/50 cursor-pointer transition-colors duration-300 text-[0.65rem] px-0.5"
          onClick={() => deleteTask(task.id)}
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
