import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-white">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-[1200px] items-center justify-between px-6">
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
            <Link href="/workspace" className="hover:text-white">
              Workspace
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
  href="/login"
  className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10 active:scale-95"
>
  Login
</Link>
            <Link
  href="/signup"
  className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.18)] transition-all duration-200 hover:bg-zinc-200 hover:shadow-[0_0_28px_rgba(255,255,255,0.25)] active:scale-95"
>
  Sign Up
</Link>
          </div>
        </div>
      </header>

      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-white/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(255,255,255,0.04),transparent_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <section
        id="home"
        className="relative z-10 flex min-h-[calc(100vh-80px)] w-screen flex-col items-center justify-center px-6 text-center"
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center">
          <div className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400">
              AI Research Workspace
            </span>
          </div>

          <h1 className="mx-auto mt-6 max-w-5xl text-center text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-7xl">
            Research faster with your own AI study workspace.
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-center text-base leading-relaxed text-neutral-400 sm:text-lg lg:text-xl">
            Upload notes, PDFs, articles, and research material. Varora AI helps
            you summarize, understand, and generate study-ready answers.
          </p>

          <div className="mt-8 flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="flex h-12 w-[210px] items-center justify-center rounded-2xl bg-white text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              Get Started
            </Link>

            <Link
              href="/workspace"
              className="flex h-12 w-[210px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Open Workspace
            </Link>
          </div>
        </div>
      </section>

      
    </main>
  );
}