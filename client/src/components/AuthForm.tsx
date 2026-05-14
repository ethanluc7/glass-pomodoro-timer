import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthForm() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const err = isSignUp ? await signUp(email, password) : await signIn(email, password);
    if (err) setError(err);
    setSubmitting(false);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6">
      <div className="glass-card rounded-3xl p-10 w-[340px]">
        <div className="text-center mb-10 relative">
          <h1 className="text-[0.8rem] font-bold text-white/50 tracking-[0.3em] uppercase mb-3" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.3)" }}>
            Pomofocus
          </h1>
          <p className="text-[0.8rem] text-white/30 font-medium tracking-wide">
            {isSignUp ? "Create your account" : "Welcome back"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 relative">
          <input
            className="input-glow bg-white/[0.04] border border-white/[0.08] rounded-xl text-white px-4 py-3.5 text-[0.8rem] outline-none transition-all duration-300 placeholder:text-white/20 focus:border-white/15 focus:bg-white/[0.06] tracking-wide"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input-glow bg-white/[0.04] border border-white/[0.08] rounded-xl text-white px-4 py-3.5 text-[0.8rem] outline-none transition-all duration-300 placeholder:text-white/20 focus:border-white/15 focus:bg-white/[0.06] tracking-wide"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && <p className="text-red-400/80 text-[0.75rem] tracking-wide">{error}</p>}

          <button
            className="glass-pill mt-2 w-full py-3.5 rounded-xl border-none text-white/80 cursor-pointer text-[0.75rem] font-bold tracking-[0.3em] uppercase transition-all duration-300 hover:text-white"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "..." : isSignUp ? "SIGN UP" : "SIGN IN"}
          </button>
        </form>

        <p className="mt-10 text-center text-[0.7rem] text-white/25 relative">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            className="bg-transparent border-none text-white/45 hover:text-white/75 transition-colors duration-300 cursor-pointer text-[0.7rem] underline underline-offset-4 decoration-white/15 hover:decoration-white/35"
            onClick={() => { setIsSignUp((v) => !v); setError(null); }}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
