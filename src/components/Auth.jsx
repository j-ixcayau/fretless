import React from "react";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";

export default function Auth() {
  const { login } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden">
      {/* Aurora mesh gradient background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden flex items-center justify-center">
        <div
          className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-primary/40 rounded-full blur-[120px] mix-blend-screen opacity-80 animate-pulse"
          style={{ animationDuration: "12s" }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-secondary/30 rounded-full blur-[120px] mix-blend-screen opacity-80 animate-pulse"
          style={{ animationDuration: "15s", animationDelay: "2s" }}
        />
        <div
          className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] bg-indigo-500/20 rounded-full blur-[100px] mix-blend-screen opacity-60 animate-pulse"
          style={{ animationDuration: "10s", animationDelay: "1s" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-md bg-card/50 backdrop-blur-3xl border border-white/10 p-10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

        <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-8 shadow-[0_0_30px_rgba(124,58,237,0.5)] relative z-10">
          <svg
            className="w-12 h-12 text-white drop-shadow-md"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
        </div>

        <h1 className="text-5xl font-normal tracking-wider mb-4 font-display text-foreground relative z-10">
          BASS<span className="text-secondary">TABS</span>
        </h1>
        <p className="text-muted-foreground/80 font-medium text-lg mb-10 tracking-wide relative z-10">
          Professional tab management and real-time transposition for bassists.
        </p>

        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-black rounded-xl font-bold hover:bg-neutral-200 transition-all transform active:scale-[0.98] shadow-lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <p className="mt-8 text-xs text-muted-foreground/60 uppercase tracking-widest font-bold">
          Free & Open Source
        </p>
      </motion.div>
    </div>
  );
}
