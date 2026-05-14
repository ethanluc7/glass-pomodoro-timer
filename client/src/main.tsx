import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import { TasksProvider } from "./context/TasksContext";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <SettingsProvider>
        <TasksProvider>
          <App />
        </TasksProvider>
      </SettingsProvider>
    </AuthProvider>
  </StrictMode>
);
