"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Home() {
  const [cursor, setCursor] = useState({ x: 50, y: 50, active: false });

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();

    setCursor({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      active: true,
    });
  };

  const handlePointerLeave = () => {
    setCursor((current) => ({ ...current, active: false }));
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#05070c] text-white">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-300 items-center justify-between px-6">
          <Link
            href="#home"
            className="text-lg font-bold tracking-tight text-white"
          >
            VARORA.AI
          </Link>

          <nav className="hidden items-center justify-center gap-8 text-sm font-medium text-zinc-400 md:flex">
            <Link href="#home" className="hover:text-white">
              Home
            </Link>
            <Link href="#features" className="hover:text-white">
              Features
            </Link>
            <Link href="/" className="hover:text-white">
              Workspace
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
  href="/login"
  className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-zinc-950 px-7 text-sm font-semibold text-white shadow-[0_0_25px_rgba(255,255,255,0.08)] transition-all duration-300 hover:border-white/35 hover:shadow-[0_0_40px_rgba(255,255,255,0.18)] active:scale-95"
>
  <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 group-hover:w-full" />

  <span className="relative z-10 flex items-center gap-2 transition-colors duration-500 group-hover:text-black">
    Login
    <span className="transition-transform duration-300 group-hover:translate-x-1">
      →
    </span>
  </span>
</Link>
            <Link
  href="/signup"
  className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-zinc-950 px-7 text-sm font-semibold text-white shadow-[0_0_25px_rgba(255,255,255,0.08)] transition-all duration-300 hover:border-white/35 hover:shadow-[0_0_40px_rgba(255,255,255,0.18)] active:scale-95"
>
  <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 group-hover:w-full" />

  <span className="relative z-10 flex items-center gap-2 transition-colors duration-500 group-hover:text-black">
    Create Account
    <span className="transition-transform duration-300 group-hover:translate-x-1">
      →
    </span>
  </span>
</Link>
          </div>
        </div>
      </header>

      <div className="pointer-events-none absolute inset-0 z-0">
        <motion.div
          aria-hidden="true"
          animate={{
            x: [0, 18, 0],
            y: [0, -12, 0],
            opacity: cursor.active ? [0.02, 0.04, 0.02] : [0.08, 0.14, 0.08],
            scale: [1, 1.08, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[12%] top-[18%] h-96 w-96 rounded-full bg-slate-500/10 blur-[170px]"
        />
        <motion.div
          aria-hidden="true"
          animate={{
            x: [0, -22, 0],
            y: [0, 16, 0],
            opacity: cursor.active ? [0.01, 0.03, 0.01] : [0.05, 0.1, 0.05],
            scale: [1, 1.12, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[12%] right-[8%] h-112 w-md rounded-full bg-indigo-500/10 blur-[190px]"
        />
        <div className="absolute left-1/2 top-0 h-125 w-125 -translate-x-1/2 rounded-full bg-black/88 blur-[190px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(255,255,255,0.01),transparent_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.012)_1px,transparent_1px)] bg-size-[64px_64px] opacity-35" />
      </div>

      <section
        id="home"
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
        className="group relative z-10 flex min-h-[calc(100vh-80px)] w-screen flex-col items-center justify-center px-6 text-center"
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          animate={{ opacity: cursor.active ? 1 : 0 }}
          transition={{ duration: 0.18 }}
          style={{
            background: cursor.active
              ? `radial-gradient(circle 620px at ${cursor.x}px ${cursor.y}px, rgba(255,250,235,0.58), rgba(255,244,214,0.3) 12%, rgba(255,231,180,0.12) 28%, rgba(255,220,150,0.04) 52%, rgba(255,255,255,0) 82%)`
              : "transparent",
            mixBlendMode: "screen",
          }}
        />

        <div className="pointer-events-none absolute inset-0 z-0 bg-black/56" />

        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center">
          <div className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 transition group-hover:text-zinc-300">
              AI Research Workspace
            </span>
          </div>

          <h1 className="mx-auto mt-6 max-w-5xl text-center text-4xl font-bold leading-tight tracking-tight text-white/68 transition duration-300 group-hover:text-white sm:text-5xl lg:text-7xl">
            Research faster with your own AI study workspace.
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-center text-base leading-relaxed text-neutral-500 transition duration-300 group-hover:text-neutral-300 sm:text-lg lg:text-xl">
            Upload notes, PDFs, articles, and research material. Varora AI helps
            you summarize, understand, and generate study-ready answers.
          </p>

          <div className="mt-8 flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
  href="/signup"
  className="group/btn relative inline-flex h-12 min-w-[180px] items-center justify-center overflow-hidden rounded-full border border-white/15 bg-zinc-950 px-6 text-sm font-semibold text-white opacity-45 shadow-[0_0_18px_rgba(255,255,255,0.05)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] hover:opacity-100 hover:border-white/35 hover:shadow-[0_0_38px_rgba(255,255,255,0.22)] active:translate-y-0 active:scale-95"
>
  <span className="pointer-events-none absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover/btn:w-full" />

  <span className="pointer-events-none absolute -inset-1 rounded-full bg-white/20 opacity-0 blur-xl transition-opacity duration-300 group-hover/btn:opacity-100" />

  <span className="pointer-events-none relative z-10 flex items-center gap-2 transition-colors duration-500 group-hover/btn:text-black">
    Get Started
    <span className="transition-transform duration-300 group-hover/btn:translate-x-1">
      →
    </span>
  </span>
</Link>

           <Link
  href="/workspace"
  className="group/btn relative inline-flex h-12 min-w-[190px] items-center justify-center overflow-hidden rounded-full border border-white/15 bg-zinc-950 px-6 text-sm font-semibold text-white opacity-45 shadow-[0_0_18px_rgba(255,255,255,0.05)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] hover:opacity-100 hover:border-white/35 hover:shadow-[0_0_38px_rgba(255,255,255,0.22)] active:translate-y-0 active:scale-95"
>
  <span className="pointer-events-none absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover/btn:w-full" />

  <span className="pointer-events-none absolute -inset-1 rounded-full bg-white/20 opacity-0 blur-xl transition-opacity duration-300 group-hover/btn:opacity-100" />

  <span className="pointer-events-none relative z-10 flex items-center gap-2 transition-colors duration-500 group-hover/btn:text-black">
    Open Workspace
    <span className="transition-transform duration-300 group-hover/btn:translate-x-1">
      →
    </span>
  </span>
</Link>
          </div>
        </div>
      </section>

      
    </main>
  );
}