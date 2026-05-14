import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { loadFromStorage, saveToStorage } from "../lib/storage";

export interface Task {
  id: string;
  title: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  done: boolean;
  createdAt: number;
}

interface TasksContextValue {
  tasks: Task[];
  activeTaskId: string | null;
  addTask: (title: string, estimatedPomodoros: number) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleDone: (id: string) => void;
  setActiveTask: (id: string | null) => void;
  reorderTask: (fromIndex: number, toIndex: number) => void;
  incrementActiveTaskPomodoro: () => void;
}

const TASKS_KEY = "pomofocus-tasks";
const ACTIVE_KEY = "pomofocus-active-task";

const TasksContext = createContext<TasksContextValue | undefined>(undefined);

function persist(tasks: Task[], activeId: string | null) {
  saveToStorage(TASKS_KEY, tasks);
  saveToStorage(ACTIVE_KEY, activeId);
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage(TASKS_KEY, []));
  const [activeTaskId, setActiveTaskId] = useState<string | null>(() =>
    loadFromStorage(ACTIVE_KEY, null)
  );

  const addTask = useCallback((title: string, estimatedPomodoros: number) => {
    const task: Task = {
      id: crypto.randomUUID(),
      title,
      estimatedPomodoros,
      completedPomodoros: 0,
      done: false,
      createdAt: Date.now(),
    };
    setTasks((prev) => {
      const next = [...prev, task];
      persist(next, null);
      return next;
    });
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      saveToStorage(TASKS_KEY, next);
      return next;
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveToStorage(TASKS_KEY, next);
      return next;
    });
    setActiveTaskId((prev) => {
      const next = prev === id ? null : prev;
      saveToStorage(ACTIVE_KEY, next);
      return next;
    });
  }, []);

  const toggleDone = useCallback((id: string) => {
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
      saveToStorage(TASKS_KEY, next);
      return next;
    });
  }, []);

  const setActiveTask = useCallback((id: string | null) => {
    setActiveTaskId(id);
    saveToStorage(ACTIVE_KEY, id);
  }, []);

  const reorderTask = useCallback((fromIndex: number, toIndex: number) => {
    setTasks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      saveToStorage(TASKS_KEY, next);
      return next;
    });
  }, []);

  const incrementActiveTaskPomodoro = useCallback(() => {
    setTasks((prev) => {
      const next = prev.map((t) => {
        if (t.id === activeTaskId) {
          return { ...t, completedPomodoros: t.completedPomodoros + 1 };
        }
        return t;
      });
      saveToStorage(TASKS_KEY, next);
      return next;
    });
  }, [activeTaskId]);

  return (
    <TasksContext.Provider
      value={{
        tasks,
        activeTaskId,
        addTask,
        updateTask,
        deleteTask,
        toggleDone,
        setActiveTask,
        reorderTask,
        incrementActiveTaskPomodoro,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within TasksProvider");
  return ctx;
}
