import Link from "next/link";
import { Sparkles, FileText, LayoutDashboard, Bookmark, Search, BookOpen } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
          <Link href="#home" className="text-lg font-bold tracking-tight text-white transition-opacity hover:opacity-80">
            VARORA.AI
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-400 md:flex">
            <Link href="#home" className="transition-colors hover:text-white">Home</Link>
            <Link href="#features" className="transition-colors hover:text-white">Features</Link>
            <Link href="/workspace" className="transition-colors hover:text-white">Workspace</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden h-9 items-center justify-center rounded-full border border-white/10 bg-white/4 px-4 text-xs font-semibold text-white transition-all hover:bg-white/8 sm:flex">
              Login
            </Link>
            <Link href="/signup" className="flex h-9 items-center justify-center rounded-full bg-white px-4 text-xs font-semibold text-black transition-all hover:bg-zinc-200">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-1/2 -top-24 h-125 w-125 -translate-x-1/2 rounded-full bg-white/8 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(255,255,255,0.03),transparent_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[64px_64px] mask-[radial-gradient(ellipse_60%_60%_at_50%_30%,#000_10%,transparent_100%)]" />
      </div>

      <section id="home" className="relative w-full px-6 py-20 text-center sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        <div className="mx-auto flex max-w-5xl flex-col items-center">
          <div className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/3 px-3 py-1 font-medium backdrop-blur-md">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400">AI Research Workspace</span>
          </div>

          <h1 className="mt-6 mx-auto max-w-5xl text-center text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-7xl">
            Research faster with your own AI study workspace.
          </h1>

          <p className="mt-6 mx-auto max-w-3xl text-center text-base leading-relaxed text-neutral-400 sm:text-lg lg:text-xl">
            Upload notes, PDFs, articles, and research material. Varora AI helps you summarize, understand, and generate study-ready answers.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup" className="flex h-12 items-center justify-center rounded-2xl bg-white px-8 text-sm font-semibold text-black transition-all hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98]">
              Get Started
            </Link>
            <Link href="/workspace" className="flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/4 px-8 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/8 hover:scale-[1.02] active:scale-[0.98]">
              Open Workspace
            </Link>
          </div>
        </div>
      </section>

      <section className="w-full px-6 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-white/3 backdrop-blur-xl shadow-[0_40px_100px_rgba(255,255,255,0.05)]">
            <div className="flex h-12 items-center gap-2 border-b border-white/5 bg-white/1 px-6">
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
            </div>

            <div className="flex flex-col gap-6 p-6 sm:min-h-87.5 sm:flex-row">
              <div className="flex flex-1 flex-col space-y-4">
                <h3 className="mb-2 text-xl font-semibold tracking-tight text-white">Research Summary</h3>
                <div className="rounded-2xl border border-white/5 bg-white/3 p-5">
                  <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Key idea extracted</p>
                  <div className="mb-3 h-2 w-3/4 rounded-full bg-zinc-700/50" />
                  <div className="h-2 w-1/2 rounded-full bg-zinc-700/50" />
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/3 p-5">
                  <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Citation found</p>
                  <div className="mb-3 h-2 w-4/5 rounded-full bg-zinc-700/50" />
                  <div className="h-2 w-1/3 rounded-full bg-zinc-700/50" />
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/3 p-5">
                  <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Study answer generated</p>
                  <div className="mb-3 h-2 w-full rounded-full bg-zinc-700/50" />
                  <div className="h-2 w-2/3 rounded-full bg-zinc-700/50" />
                </div>
              </div>

              <div className="hidden w-60 shrink-0 flex-col space-y-4 border-l border-white/5 pl-6 sm:flex">
                <div className="space-y-4">
                  <div className="h-16 w-full rounded-2xl border border-white/5 bg-white/3" />
                  <div className="h-16 w-full rounded-2xl border border-white/5 bg-white/3" />
                  <div className="h-32 w-full rounded-2xl border border-white/5 bg-white/3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="w-full px-6 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">Everything you need for smarter research.</h2>
            <p className="mt-4 text-base text-zinc-400">From uploaded notes to clean summaries, citations, and exam-ready answers.</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: FileText, title: "Upload Notes & PDFs", description: "Add your study material, class notes, PDFs, or articles in one place." },
              { icon: LayoutDashboard, title: "Smart Summaries", description: "Turn long content into simple, clear, and easy-to-revise summaries." },
              { icon: Search, title: "Citation Finder", description: "Extract useful references and citation-ready points from your sources." },
              { icon: Sparkles, title: "Deep Research Mode", description: "Ask complex questions and get structured long-form research answers." },
              { icon: Bookmark, title: "Saved Notes", description: "Keep important points, summaries, and answers organized for later." },
              { icon: BookOpen, title: "Study-Ready Answers", description: "Generate clear answers that help with assignments, exams, and revision." },
            ].map((feature, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/3 p-6 transition hover:bg-white/5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/8 text-white">
                  <feature.icon size={18} />
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">{feature.title}</h3>
                <p className="text-sm leading-6 text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full px-6 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-6xl text-center">
          <div className="rounded-[40px] border border-white/10 bg-white/2 px-8 py-16 backdrop-blur-xl md:px-16">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-white md:text-4xl">How Varora AI works</h2>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/3 p-6 text-center">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/5 text-xl font-bold text-white">1</div>
                <h4 className="mb-2 text-lg font-semibold text-white">Upload your material</h4>
                <p className="text-sm text-zinc-400">Drag and drop your PDFs, articles, or custom text.</p>
              </div>
              <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/3 p-6 text-center">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/5 text-xl font-bold text-white">2</div>
                <h4 className="mb-2 text-lg font-semibold text-white">Ask your question</h4>
                <p className="text-sm text-zinc-400">Engage the workspace with complex tasks and extractions.</p>
              </div>
              <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/3 p-6 text-center">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/5 text-xl font-bold text-white">3</div>
                <h4 className="mb-2 text-lg font-semibold text-white">Get summaries & answers</h4>
                <p className="text-sm text-zinc-400">Collect study-ready output, citations, and polished data.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-6 py-20 sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">Start building your AI research workspace today.</h2>
          <p className="mt-6 text-base text-zinc-400 md:text-lg">Create your account and turn your study material into clear, useful knowledge.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/signup" className="flex h-12 items-center justify-center rounded-2xl bg-white px-8 text-sm font-semibold text-black transition-all hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98]">
              Create account
            </Link>
            <Link href="/login" className="flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/4 px-8 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/8 hover:scale-[1.02] active:scale-[0.98]">
              Login
            </Link>
          </div>
        </div>
      </section>

      <footer className="mt-12 w-full border-t border-white/10 px-6 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
            <span className="text-base font-bold tracking-tight text-white">VARORA.AI</span>
            <span className="mt-1 text-xs text-zinc-500">Built for students, researchers, and creators.</span>
          </div>
          <div className="flex gap-6 text-sm font-medium text-zinc-500">
            <Link href="#home" className="transition hover:text-white">Home</Link>
            <Link href="#features" className="transition hover:text-white">Features</Link>
            <Link href="/workspace" className="transition hover:text-white">Workspace</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}