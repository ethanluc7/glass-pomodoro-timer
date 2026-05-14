import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AccountMenu() {
  const { signOut, deleteAccount } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const err = await deleteAccount();
    if (err) {
      alert(err);
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        className="glass-pill rounded-lg px-3 py-1.5 border-none text-white/35 hover:text-white/65 transition-all duration-300 cursor-pointer text-[0.65rem] font-semibold tracking-widest uppercase"
        onClick={signOut}
      >
        Sign Out
      </button>

      {!confirming ? (
        <button
          className="glass-pill rounded-lg px-3 py-1.5 border-none text-red-400/40 hover:text-red-400/70 transition-all duration-300 cursor-pointer text-[0.65rem] font-semibold tracking-widest uppercase"
          onClick={() => setConfirming(true)}
        >
          Delete
        </button>
      ) : (
        <div className="flex items-center gap-2 text-[0.65rem]">
          <span className="text-white/40">Sure?</span>
          <button className="bg-transparent border-none text-red-400/70 cursor-pointer text-[0.65rem] font-semibold" onClick={handleDelete} disabled={deleting}>
            {deleting ? "..." : "Yes"}
          </button>
          <button className="bg-transparent border-none text-white/25 hover:text-white/50 transition-colors duration-300 cursor-pointer text-[0.65rem]" onClick={() => setConfirming(false)}>
            No
          </button>
        </div>
      )}
    </div>
  );
}
