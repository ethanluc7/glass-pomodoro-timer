import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

dotenv.config({ path: "../.env" });

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const MOCK_MODE = !supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey;

if (MOCK_MODE) {
  console.log("⚠ Supabase env vars not set — running in mock mode (in-memory storage)");
}

// ─── Real Supabase clients (only created when env vars exist) ───────────────
const supabaseAdmin = MOCK_MODE
  ? null
  : createClient(supabaseUrl, supabaseServiceRoleKey);

function createUserClient(accessToken: string) {
  if (MOCK_MODE) return null;
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

// ─── In-memory session store for mock mode ──────────────────────────────────
interface MockSession {
  id: string;
  duration: number;
  elapsed_seconds: number;
  type: string;
  started_at: string;
  user_id: string;
  created_at: string;
}

const mockSessions: MockSession[] = [];

// Extend Express Request to carry auth info
interface AuthRequest extends Request {
  userId: string;
  accessToken: string;
}

// Auth middleware
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (MOCK_MODE) {
    // In mock mode, accept any request
    (req as AuthRequest).userId = "fake-user-id";
    (req as AuthRequest).accessToken = "mock-token";
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.slice(7);
  const { data, error } = await supabaseAdmin!.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  (req as AuthRequest).userId = data.user.id;
  (req as AuthRequest).accessToken = token;
  next();
}

// ─── Health (unauthenticated) ────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ─── Sessions ────────────────────────────────────────────────────────────────
app.get("/api/sessions", requireAuth, async (req: Request, res: Response) => {
  if (MOCK_MODE) {
    return res.json([...mockSessions].reverse());
  }

  const { accessToken } = req as AuthRequest;
  const supabase = createUserClient(accessToken)!;

  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/sessions", requireAuth, async (req: Request, res: Response) => {
  if (MOCK_MODE) {
    const { duration, elapsed_seconds, type, started_at, user_id } = req.body;
    const session: MockSession = {
      id: crypto.randomUUID(),
      duration,
      elapsed_seconds,
      type,
      started_at,
      user_id: user_id || "fake-user-id",
      created_at: new Date().toISOString(),
    };
    mockSessions.push(session);
    return res.json(session);
  }

  const { accessToken } = req as AuthRequest;
  const supabase = createUserClient(accessToken)!;

  const { duration, elapsed_seconds, type, started_at, user_id } = req.body;

  const { data, error } = await supabase
    .from("sessions")
    .insert({ duration, elapsed_seconds, type, started_at, user_id })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.patch("/api/sessions/:id", requireAuth, async (req: Request, res: Response) => {
  if (MOCK_MODE) {
    const { id } = req.params;
    const { elapsed_seconds } = req.body;
    const session = mockSessions.find((s) => s.id === id);
    if (session) {
      session.elapsed_seconds = elapsed_seconds;
      return res.json(session);
    }
    return res.status(404).json({ error: "Session not found" });
  }

  const { accessToken } = req as AuthRequest;
  const supabase = createUserClient(accessToken)!;

  const { id } = req.params;
  const { elapsed_seconds } = req.body;

  const { data, error } = await supabase
    .from("sessions")
    .update({ elapsed_seconds })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── Account deletion ────────────────────────────────────────────────────────
app.delete("/api/account", requireAuth, async (req: Request, res: Response) => {
  if (MOCK_MODE) {
    return res.json({ success: true });
  }

  const { userId } = req as AuthRequest;

  const { error } = await supabaseAdmin!.auth.admin.deleteUser(userId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ─── Start server ────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
