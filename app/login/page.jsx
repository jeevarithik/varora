"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [isLogin, setIsLogin] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (session) router.push("/workspace");
  }, [session, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      if (isLogin) {
        const res = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
          callbackUrl: "/workspace",
        });

        if (res?.error) {
          setErrorMessage("Invalid email or password.");
        } else {
          router.replace("/workspace");
          router.refresh();
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
            callbackUrl: "/workspace",
          });

          if (loginRes?.error) {
            setErrorMessage("Account created, but sign in failed.");
          } else {
            router.replace("/workspace");
            router.refresh();
          }
        } else {
          setErrorMessage(data.error || "Sign up failed.");
        }
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Unable to authenticate right now. Please try again.");
    }

    setLoading(false);
  };

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#050505] text-white">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:70px_70px]" />

      {/* Main soft moving background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="animate-bg-float-1 absolute left-[10%] top-[20%] h-80 w-80 rounded-full bg-white/[0.055] blur-[100px]" />
        <div className="animate-bg-float-2 absolute bottom-[15%] right-[12%] h-96 w-96 rounded-full bg-white/[0.045] blur-[120px]" />
        <div className="animate-bg-float-3 absolute left-[45%] top-[35%] h-[480px] w-[480px] rounded-full bg-white/[0.035] blur-[140px]" />
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/70 to-black" />

      <section className="relative z-10 flex min-h-dvh items-center justify-center px-6 py-10">
        <div className="grid w-full max-w-6xl items-center gap-20 lg:grid-cols-[1fr_480px]">
          {/* Left Content */}
          <div className="hidden lg:block">
            <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white text-black shadow-[0_0_45px_rgba(255,255,255,0.22)]">
              <Sparkles size={26} className="fill-black" />
            </div>

            <h1 className="max-w-lg text-5xl font-semibold leading-tight tracking-tight">
              Your AI research workspace
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-white/45">
              Upload notes, summarize sources, generate citations, and synthesize
              knowledge in seconds. Focus on the insight, not the process.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/50">
              {["Smart summaries", "Deep research", "Citations"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.08]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Login Card Wrapper with animation behind */}
          <div className="relative">
            {/* Repeating animation behind card */}
            <div className="absolute -inset-10 -z-10">
              <div className="animate-card-glow absolute inset-0 rounded-[40px] bg-white/[0.08] blur-[90px]" />
              <div className="animate-card-ring absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
              <div className="animate-card-ring-reverse absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
            </div>

            {/* Login Card */}
            <div className="rounded-[32px] border border-white/10 bg-[#0b0b0b]/80 p-7 shadow-[0_35px_120px_rgba(0,0,0,0.85)] backdrop-blur-2xl md:p-9">
              {/* Brand */}
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black shadow-[0_0_35px_rgba(255,255,255,0.22)]">
                  <Sparkles size={18} className="fill-black" />
                </div>

                <div>
                  <p className="text-base font-semibold">Varora AI</p>
                  <p className="text-xs text-white/40">
                    Research smarter. Summarize faster.
                  </p>
                </div>
              </div>

              {/* Heading */}
              <div className="mb-8">
                <h2 className="text-4xl font-semibold tracking-tight">
                  {isLogin ? "Welcome back" : "Create account"}
                </h2>

                <p className="mt-2 text-sm text-white/45">
                  {isLogin
                    ? "Login to continue to your AI research workspace."
                    : "Sign up to start your AI research workspace."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/70">
                      Full Name
                    </label>

                    <input
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="h-13 w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/25 focus:border-white/30 focus:bg-white/[0.09] focus:shadow-[0_0_35px_rgba(255,255,255,0.08)]"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-xs font-medium text-white/70">
                    Email address
                  </label>

                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="h-13 w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/25 focus:border-white/30 focus:bg-white/[0.09] focus:shadow-[0_0_35px_rgba(255,255,255,0.08)]"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-medium text-white/70">
                      Password
                    </label>

                    {isLogin && (
                      <a
                        href="#"
                        className="text-xs text-white/35 transition hover:text-white"
                      >
                        Forgot password?
                      </a>
                    )}
                  </div>

                  <input
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="h-13 w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/25 focus:border-white/30 focus:bg-white/[0.09] focus:shadow-[0_0_35px_rgba(255,255,255,0.08)]"
                  />
                </div>

                {errorMessage && (
                  <p className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/80">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold text-black transition-all duration-300 hover:-translate-y-1 hover:bg-zinc-200 hover:shadow-[0_0_45px_rgba(255,255,255,0.25)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}

                  {!loading && (
                    <ArrowRight
                      size={16}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  )}
                </button>
              </form>

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />
                <p className="text-[11px] uppercase tracking-[0.25em] text-white/35">
                  or continue with
                </p>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <button
                type="button"
                className="group flex h-13 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] text-sm font-medium text-white transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.09] hover:shadow-[0_0_35px_rgba(255,255,255,0.09)] active:scale-[0.98]"
              >
                <span className="text-lg font-semibold transition-transform duration-300 group-hover:scale-110">
                  G
                </span>
                Continue with Google
              </button>

              <p className="mt-7 text-center text-sm text-white/40">
                {isLogin ? "Don't have an account? " : "Already have an account? "}

                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrorMessage("");
                  }}
                  className="font-semibold text-white transition hover:text-white/70"
                >
                  {isLogin ? "Sign up" : "Log in"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}