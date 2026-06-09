"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FiUpload } from "react-icons/fi";
import Link from "next/link";

export default function WorkspacePage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const [torchActive, setTorchActive] = useState(false);
  const [buttonHovering, setButtonHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "Welcome to Varora AI. Upload a file or ask anything to begin research.",
    },
  ]);

  const uploadedFileRef = useRef(null);

  const showTorch = torchActive && !buttonHovering;

  const buttonHoverProps = {
    onMouseEnter: () => setButtonHovering(true),
    onMouseLeave: () => setButtonHovering(false),
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      const processedFile = {
        name: data.fileName || file.name,
        text: data.text || "",
      };

      setUploadedFile(processedFile);
      uploadedFileRef.current = processedFile;

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: `Successfully uploaded and processed ${processedFile.name}`,
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "File upload failed. Please upload a readable file.",
        },
      ]);
    }
  };

  const sendMessage = async () => {
    if (!query.trim() || loading) return;

    const userMessage = query;
    setQuery("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
      },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          fileText: uploadedFileRef.current?.text || "",
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: data.reply || "Something went wrong.",
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "AI request failed. Check your API route or API key.",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <main
      onMouseMove={(e) => {
        setMousePosition({
          x: e.clientX,
          y: e.clientY,
        });
      }}
      onMouseEnter={() => setTorchActive(true)}
      onMouseLeave={() => {
        setTorchActive(false);
        setButtonHovering(false);
      }}
      className="relative min-h-screen overflow-x-hidden bg-black text-white"
    >
      {/* Soft dim only before mouse enters */}
      <div
        className={`pointer-events-none fixed inset-0 z-[4] bg-black transition-opacity duration-700 ${
          torchActive ? "opacity-0" : "opacity-20"
        }`}
      />

      {/* Mouse Torch - hidden when hovering buttons */}
      <div
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
        }}
        className={`pointer-events-none fixed z-[60] h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 blur-[90px] mix-blend-screen transition-opacity duration-300 ${
          showTorch ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
        }}
        className={`pointer-events-none fixed z-[61] h-[130px] w-[130px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 blur-[45px] mix-blend-screen transition-opacity duration-300 ${
          showTorch ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Background Glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-white/10 blur-[140px] sm:h-[520px] sm:w-[520px]" />

      <div className="pointer-events-none absolute bottom-20 right-0 h-[360px] w-[360px] rounded-full bg-white/10 blur-[150px] sm:h-[500px] sm:w-[500px]" />

      {/* Navbar */}
      <header className="relative z-20 w-full border-b border-white/10 bg-black/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
          <motion.h1
            animate={{
              opacity: [0.85, 1, 0.85],
              textShadow: [
                "0 0 12px rgba(255,255,255,0.08)",
                "0 0 28px rgba(255,255,255,0.18)",
                "0 0 12px rgba(255,255,255,0.08)",
              ],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="shrink-0 bg-gradient-to-r from-white via-white to-white bg-clip-text text-xl font-semibold text-transparent sm:text-2xl md:text-[2rem]"
          >
            VARORA.AI
          </motion.h1>

          <nav className="hidden items-center justify-center gap-8 md:flex">
            <a
              href="/"
              className="text-sm text-white/70 transition hover:text-white"
            >
              Home
            </a>

            <a
              href="/#features"
              className="text-sm text-white/70 transition hover:text-white"
            >
              Features
            </a>

            <a
              href="/workspace"
              className="text-sm text-white transition hover:text-white"
            >
              Workspace
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/login"
              {...buttonHoverProps}
              className="group relative z-[80] inline-flex h-12 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-zinc-950 px-6 text-sm font-semibold text-white shadow-[0_0_25px_rgba(255,255,255,0.08)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] hover:border-white/40 hover:shadow-[0_0_55px_rgba(255,255,255,0.35)] active:translate-y-0 active:scale-95"
            >
              <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 group-hover:w-full" />

              <span className="absolute -inset-1 rounded-xl bg-white/20 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />

              <span className="relative z-10 flex items-center gap-2 transition-colors duration-500 group-hover:text-black">
                Login
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </span>
            </Link>

            <Link
              href="/signup"
              {...buttonHoverProps}
              className="group relative z-[80] inline-flex h-12 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-zinc-950 px-6 text-sm font-semibold text-white shadow-[0_0_25px_rgba(255,255,255,0.08)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] hover:border-white/40 hover:shadow-[0_0_55px_rgba(255,255,255,0.35)] active:translate-y-0 active:scale-95"
            >
              <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 group-hover:w-full" />

              <span className="absolute -inset-1 rounded-xl bg-white/20 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />

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

      {/* Workspace Section */}
      <section className="relative z-10 w-full px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-medium uppercase tracking-[0.25em] text-white backdrop-blur-xl"
          >
            AI Research Workspace
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            className="mt-8 max-w-5xl text-center text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-7xl"
          >
            Research faster with your own{" "}
            <motion.span
              animate={{
                opacity: [0.85, 1, 0.85],
                textShadow: [
                  "0 0 12px rgba(255,255,255,0.08)",
                  "0 0 28px rgba(255,255,255,0.18)",
                  "0 0 12px rgba(255,255,255,0.08)",
                ],
              }}
              className="bg-gradient-to-r from-white via-white to-white bg-clip-text text-transparent"
            >
              AI study workspace.
            </motion.span>
          </motion.h2>

          <p className="mt-6 max-w-3xl text-center text-base leading-8 text-white/70 sm:text-lg">
            Upload notes, PDFs, articles, and research material. Varora AI helps
            you summarize, understand, and generate study-ready answers.
          </p>

          {/* Hero Buttons */}
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              {...buttonHoverProps}
              className="group relative z-[80] inline-flex h-14 min-w-[180px] items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white px-7 text-sm font-bold text-black shadow-[0_0_45px_rgba(255,255,255,0.25)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] hover:shadow-[0_0_75px_rgba(255,255,255,0.45)] active:translate-y-0 active:scale-95"
            >
              <span className="absolute -inset-1 rounded-2xl bg-white/40 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

              <span className="absolute -left-16 top-0 h-full w-14 rotate-12 bg-white/70 blur-md transition-all duration-700 group-hover:left-[120%]" />

              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </span>
            </Link>

            <Link
              href="/workspace"
              {...buttonHoverProps}
              className="group relative z-[80] inline-flex h-14 min-w-[190px] items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-zinc-950 px-7 text-sm font-bold text-white shadow-[0_0_25px_rgba(255,255,255,0.08)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] hover:border-white/40 hover:shadow-[0_0_55px_rgba(255,255,255,0.28)] active:translate-y-0 active:scale-95"
            >
              <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 group-hover:w-full" />

              <span className="absolute -inset-1 rounded-2xl bg-white/20 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />

              <span className="relative z-10 flex items-center gap-2 transition-colors duration-500 group-hover:text-black">
                Open Workspace
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </span>
            </Link>
          </div>

          {/* Chat Card */}
          <div className="relative mt-12 w-full max-w-5xl">
            <motion.div
              animate={{
                opacity: [0.18, 0.32, 0.18],
                scale: [1, 1.06, 1],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-[160px]"
            />

            <div className="relative z-10 overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] text-left shadow-[0_0_120px_rgba(255,255,255,0.05)] backdrop-blur-[35px] sm:rounded-[36px]">
              {/* Messages */}
              <div className="max-h-[300px] min-h-[260px] space-y-5 overflow-y-auto px-5 pt-6 sm:px-8 sm:pt-8">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl border border-white/10 px-5 py-4 text-sm leading-7 backdrop-blur-xl sm:max-w-[80%] ${
                        msg.role === "user"
                          ? "bg-white/10 text-white"
                          : "bg-black/20 text-white/80"
                      }`}
                    >
                      <p className="mb-1 font-semibold text-white">
                        {msg.role === "user" ? "You" : "Varora AI"}
                      </p>

                      {msg.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <p className="text-sm text-white/60">
                    Varora AI is thinking...
                  </p>
                )}
              </div>

              {/* Textarea */}
              <div className="px-5 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-8">
                <textarea
                  rows={5}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask Varora AI anything..."
                  className="w-full resize-none bg-transparent text-base leading-8 text-white outline-none placeholder:text-white/50 sm:text-[18px] sm:leading-9"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
              </div>

              {/* Bottom Controls */}
              <div className="flex flex-col gap-4 border-t border-white/10 bg-white/[0.03] px-5 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <label
                    {...buttonHoverProps}
                    className="relative z-[80] cursor-pointer"
                  >
                    <input
                      type="file"
                      accept=".txt,.md,.pdf,.docx,.pptx"
                      className="hidden"
                      onChange={handleFileUpload}
                    />

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/10 hover:shadow-[0_0_35px_rgba(255,255,255,0.18)]">
                      <FiUpload className="text-white" />
                    </div>
                  </label>

                  {uploadedFile && (
                    <div className="flex max-w-[240px] items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white backdrop-blur-xl">
                      <span className="truncate">{uploadedFile.name}</span>

                      <button
                        {...buttonHoverProps}
                        onClick={() => {
                          setUploadedFile(null);
                          uploadedFileRef.current = null;
                        }}
                        className="relative z-[80] text-white/70 hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  <button
                    {...buttonHoverProps}
                    onClick={() =>
                      setQuery(
                        "Do deep research on the uploaded file or topic. Give me a clear summary, key points, advantages, disadvantages, examples, possible sources, and final conclusion."
                      )
                    }
                    className="group relative z-[80] overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/80 transition duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/10 hover:text-white hover:shadow-[0_0_35px_rgba(255,255,255,0.18)]"
                  >
                    <span className="absolute -left-12 top-0 h-full w-10 rotate-12 bg-white/20 blur-md transition-all duration-700 group-hover:left-[120%]" />
                    <span className="relative z-10">Deep Research</span>
                  </button>
                </div>

                <motion.button
                  {...buttonHoverProps}
                  whileHover={{ scale: 1.08, y: -4 }}
                  whileTap={{ scale: 0.95, y: 0 }}
                  onClick={sendMessage}
                  disabled={loading}
                  className="relative z-[80] flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white font-bold text-black shadow-[0_0_40px_rgba(255,255,255,0.25)] transition hover:bg-white/80 hover:shadow-[0_0_65px_rgba(255,255,255,0.45)] disabled:opacity-60"
                >
                  {loading ? "..." : "↑"}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}