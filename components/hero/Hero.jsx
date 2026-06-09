"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FiUpload } from "react-icons/fi";
import Link from "next/link";

export default function WorkspacePage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "Welcome to Varora AI. Upload a file or ask anything to begin research.",
    },
  ]);

  const uploadedFileRef = useRef(null);

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
    <main className="relative min-h-screen overflow-x-hidden bg-black text-white">
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
            <a href="/" className="text-sm text-white/70 transition hover:text-white">
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
              className="rounded-full border border-white/20 px-4 py-2 text-sm text-white transition hover:bg-white hover:text-black sm:px-5"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 sm:px-5"
            >
              Sign Up
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
            Research Workspace
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            className="mt-8 max-w-5xl text-center text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-7xl"
          >
            Ask, Upload and Analyze with{" "}
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
              Varora AI
            </motion.span>
          </motion.h2>

          <p className="mt-6 max-w-3xl text-center text-base leading-8 text-white/70 sm:text-lg">
            Upload notes, PDFs, articles, or research material and generate
            simple summaries, insights, and study-ready answers.
          </p>

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
              <div className="px-5 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-6">
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
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".txt,.md,.pdf,.docx,.pptx"
                      className="hidden"
                      onChange={handleFileUpload}
                    />

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition duration-300 hover:border-white/30 hover:bg-white/10">
                      <FiUpload className="text-white" />
                    </div>
                  </label>

                  {uploadedFile && (
                    <div className="flex max-w-[240px] items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white backdrop-blur-xl">
                      <span className="truncate">{uploadedFile.name}</span>

                      <button
                        onClick={() => {
                          setUploadedFile(null);
                          uploadedFileRef.current = null;
                        }}
                        className="text-white/70 hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() =>
                      setQuery(
                        "Do deep research on the uploaded file or topic. Give me a clear summary, key points, advantages, disadvantages, examples, possible sources, and final conclusion."
                      )
                    }
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/80 transition duration-300 hover:border-white/30 hover:bg-white/10"
                  >
                    Deep Research
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={loading}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white font-bold text-black shadow-[0_0_40px_rgba(255,255,255,0.25)] transition hover:bg-white/80 disabled:opacity-60"
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