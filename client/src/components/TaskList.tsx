import { useState, type FormEvent } from "react";
import { useTasks } from "../context/TasksContext";
import TaskItem from "./TaskItem";

export default function TaskList() {
  const { tasks, activeTaskId } = useTasks();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="w-full max-w-[480px] mt-10">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-[0.7rem] text-white/25 tracking-[0.25em] uppercase font-semibold" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
          Tasks
        </h2>
        <button
          className="bg-transparent border-none text-white/25 hover:text-white/50 cursor-pointer text-[0.7rem] tracking-wide transition-colors duration-300"
          onClick={() => setShowAdd((v) => !v)}
        >
          {showAdd ? "Cancel" : "+ Add"}
        </button>
      </div>

      {showAdd && <AddTaskForm onAdded={() => setShowAdd(false)} />}

      {tasks.length > 0 && (
        <div className="glass-card rounded-2xl p-2">
          <div className="flex flex-col relative">
            {tasks.map((task, i) => (
              <TaskItem
                key={task.id}
                task={task}
                index={i}
                isActive={task.id === activeTaskId}
                isFirst={i === 0}
                isLast={i === tasks.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && !showAdd && (
        <p className="text-center text-[0.75rem] text-white/15 py-8">No tasks yet</p>
      )}
    </div>
  );
}

function AddTaskForm({ onAdded }: { onAdded: () => void }) {
  const { addTask } = useTasks();
  const [title, setTitle] = useState("");
  const [est, setEst] = useState(1);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask(title.trim(), est);
    setTitle("");
    setEst(1);
    onAdded();
  };

  return (
    <div className="mb-4 glass-card rounded-2xl p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 relative">
        <input
          className="bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-[0.8rem] px-3 py-2.5 outline-none focus:border-white/15 transition-all duration-300 placeholder:text-white/20"
          placeholder="What are you working on?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[0.65rem] text-white/25">Est. pomodoros:</span>
            <input
              type="number"
              className="bg-white/[0.04] border border-white/[0.08] rounded-md text-white text-[0.75rem] text-center w-12 py-1 outline-none focus:border-white/15"
              value={est}
              onChange={(e) => setEst(Math.max(1, parseInt(e.target.value, 10) || 1))}
              min={1} max={20}
            />
          </div>
          <button
            type="submit"
            className="glass-pill rounded-lg px-4 py-1.5 border-none text-white/55 hover:text-white/85 cursor-pointer text-[0.7rem] font-semibold tracking-wider uppercase transition-all duration-300"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
