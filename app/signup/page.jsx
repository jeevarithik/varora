"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Signup failed");
      setLoading(false);
      return;
    }

    router.push("/login");
  }

  return (
    <main className="min-h-[100dvh] w-full overflow-hidden bg-black text-white flex items-center justify-center px-6 relative selection:bg-white/30">
      {/* Background gradients */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_35%)]" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_40%)]" />

      {/* Subtle Grid / Noise */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl p-8">
        
        {/* Branding top section */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-11 w-11 rounded-2xl bg-white text-black flex items-center justify-center font-bold mb-3 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <Sparkles size={20} className="fill-black" />
          </div>
          <p className="text-sm font-semibold text-white">Varora AI</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Build your research workspace</p>
        </div>

        {/* Main heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-center">Create account</h1>
          <p className="mt-2 text-sm text-white/50 text-center">
            Start researching smarter with Varora AI.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/30 focus:ring-1 focus:ring-white/30 [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:text-white [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[9999s] [color-scheme:dark]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Email address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/30 focus:ring-1 focus:ring-white/30 [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:text-white [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[9999s] [color-scheme:dark]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/30 focus:ring-1 focus:ring-white/30 [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:text-white [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[9999s] [color-scheme:dark]"
              required
            />
            <p className="text-xs text-white/40 mt-1">Use at least 6 characters.</p>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center bg-red-500/10 border border-red-500/20 py-2 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 rounded-2xl bg-white text-sm font-medium text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="my-6 flex items-center justify-center space-x-4">
          <div className="h-px flex-1 bg-white/10" />
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">or continue with</p>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          disabled
          className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-medium text-white transition-all hover:bg-white/[0.07] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="size-[18px]" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <p className="mt-8 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-white transition-colors hover:underline hover:text-white">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}