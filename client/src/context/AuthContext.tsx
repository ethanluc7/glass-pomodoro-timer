import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// TODO: Remove this flag to re-enable real Supabase auth
const SKIP_AUTH = true;

const FAKE_USER = {
  id: "fake-user-id",
  email: "test@example.com",
} as User;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(SKIP_AUTH ? FAKE_USER : null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(SKIP_AUTH ? false : true);

  useEffect(() => {
    if (SKIP_AUTH) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    if (SKIP_AUTH) return null;
    const { error } = await supabase.auth.signUp({ email, password });
    return error ? error.message : null;
  };

  const signIn = async (email: string, password: string) => {
    if (SKIP_AUTH) return null;
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return error ? error.message : null;
  };

  const signOut = async () => {
    if (SKIP_AUTH) return;
    await supabase.auth.signOut();
  };

  const deleteAccount = async () => {
    if (SKIP_AUTH) return null;
    const accessToken = session?.access_token;
    if (!accessToken) return "Not authenticated";

    const res = await fetch("/api/account", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return body?.error ?? "Failed to delete account";
    }

    await supabase.auth.signOut();
    return null;
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signUp, signIn, signOut, deleteAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
