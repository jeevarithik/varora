"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      router.push("/workspace");
    }
  }, [session, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const res = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (!res.error) {
          router.push("/workspace");
        }
      } else {
        const signupRes = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await signupRes.json();

        if (data.success) {
          const loginRes = await signIn("credentials", {
            email: formData.email,
            password: formData.password,
            redirect: false,
          });

          if (!loginRes.error) {
            router.push("/workspace");
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <main className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-black text-white selection:bg-white/30">
      {/* Subtler Radial Glow */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <div className="h-[40rem] w-[40rem] rounded-full bg-white/[0.015] blur-[120px]" />
      </div>

      {/* Subtle Grid / Noise */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />

      <div className="container relative z-10 flex items-center justify-center gap-20 px-6">
        
        {/* Left/Right visual text (Hidden on small) */}
        <div className="hidden max-w-sm flex-col lg:flex">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            <Sparkles size={24} className="fill-black" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-white">Your AI research workspace</h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-500">Upload notes, summarize sources, generate citations, and synthesize knowledge in seconds. Focus on the insight, not the process.</p>
        </div>

        {/* The Login Card */}
        <div className="w-full max-w-md shrink-0 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-xl md:p-8">
          
          {/* Small Branding Top */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-xl bg-white text-black">
              <Sparkles size={14} className="fill-black" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Varora AI</p>
              <p className="text-[10px] text-zinc-500">Research smarter. Summarize faster.</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              {isLogin ? "Welcome back" : "Create an account"}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              {isLogin ? "Login to continue to your AI research workspace." : "Sign up to start your AI research workspace."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 shadow-sm">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-white/30 focus:ring-1 focus:ring-white/30 [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:text-white [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[9999s] [color-scheme:dark]"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Email address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-white/30 focus:ring-1 focus:ring-white/30 [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:text-white [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[9999s] [color-scheme:dark]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300">Password</label>
                {isLogin && <a href="#" className="text-xs text-zinc-500 transition-colors hover:text-white">Forgot password?</a>}
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-white/30 focus:ring-1 focus:ring-white/30 [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:text-white [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[9999s] [color-scheme:dark]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-12 w-full rounded-2xl bg-white text-sm font-semibold text-black transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
            </button>
          </form>

          <div className="my-6 flex items-center justify-center space-x-4">
            <div className="h-px flex-1 bg-white/10" />
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">or continue with</p>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button
            type="button"
            className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-medium text-white transition-all hover:bg-white/[0.08] active:scale-[0.98]"
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
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-white transition-colors hover:text-zinc-300">
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}