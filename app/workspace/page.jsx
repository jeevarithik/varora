"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Clock, 
  FileText, 
  Bookmark, 
  BookOpen, 
  Settings, 
  LogOut, 
  Upload, 
  Sparkles, 
  Download, 
  ArrowUp, 
  Copy, 
  Check, 
  Menu,
  X 
} from "lucide-react";

export default function WorkspacePage() {
  const { data: session } = useSession();

  // States
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deepResearch, setDeepResearch] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const savedNotes = [];
  const citations = [];
  const recentResearch = [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Functions
  const handleSend = async (forcedInitialMessage = null) => {
    const textToSend = forcedInitialMessage || input;

    if (!textToSend.trim() && files.length === 0) return;

    const userMessage = {
      role: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const fileText = files
        .map((file) => file.text || "")
        .filter(Boolean)
        .join("\n\n");

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: textToSend,
          fileText,
          deepResearch,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AI request failed");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: data.reply || data.message || "No response received.",
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "Sorry, Varora AI had trouble responding. Please check the API key or server route and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const newFiles = Array.from(e.target.files);
    if (!newFiles.length) return;

    for (const file of newFiles) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        setFiles((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            text: data.text || "",
            file,
          },
        ]);
      } catch (error) {
        console.error("Upload error:", error);
      }
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      if (!newFiles.length) return;

      for (const file of newFiles) {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();

          setFiles((prev) => [
            ...prev,
            {
              name: file.name,
              type: file.type,
              text: data.text || "",
              file,
            },
          ]);
        } catch (error) {
          console.error("Upload error:", error);
        }
      }
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const handleExportMarkdown = () => {
    alert("Export successful!");
  };

  const toggleDeepResearch = () => {
    setDeepResearch(!deepResearch);
  };

  const submitSuggestion = (text) => {
    handleSend(text);
  };

  return (
    <div 
      className="h-[100dvh] w-screen overflow-hidden bg-black text-white flex"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Background Breathing Blur */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-white/5 blur-[120px]"
      />
      
      {/* Main wrapper */}
      <div className="flex h-full w-full overflow-hidden">
        
        {/* --- Sidebar (Desktop) --- */}
        <aside className={`absolute z-50 w-[300px] shrink-0 h-full border-r border-white/10 bg-black/60 px-5 py-6 flex flex-col backdrop-blur-xl transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          
          {/* Mobile close overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-[-1] bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
          )}

          <div className="mb-8 space-y-1 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-white">Varora</h1>
              <p className="mt-1 text-xs leading-5 text-zinc-500">AI Research Workspace</p>
            </div>
            <button className="rounded-xl bg-white/10 p-2 md:hidden" onClick={() => setSidebarOpen(false)}>
              <Menu size={16} />
            </button>
          </div>

          <button 
            onClick={() => setMessages([])}
            className="mb-6 flex h-12 w-full items-center gap-3 rounded-2xl px-4 bg-white text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-black text-white">
              <Plus size={18} />
            </div>
            <span>New Research</span>
          </button>

          <nav className="custom-scrollbar flex-1 overflow-y-auto pr-2">
            <div className="mb-3 px-2 text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-600">Workspace</div>
            <div className="space-y-2">
              {[
                { icon: Clock, label: "Recent Research", data: recentResearch },
                { icon: FileText, label: "Uploaded Files", data: files },
                { icon: BookOpen, label: "Citations", data: citations },
                { icon: Bookmark, label: "Saved Notes", data: savedNotes },
                { icon: Settings, label: "Settings", data: [] },
              ].map((item, idx) => (
                <button key={idx} className="flex h-11 items-center gap-3 rounded-xl px-4 text-sm w-full text-zinc-400 transition hover:bg-white/[0.07] hover:text-white">
                  <item.icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </nav>

          <div className="mt-auto">
            <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex items-center gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-white/10" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-white">{session?.user?.email || "Guest"}</p>
                <p className="truncate text-xs text-zinc-400">Pro Plan</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex h-11 rounded-xl px-4 w-full items-center justify-center gap-2 border border-white/10 text-sm text-zinc-400 transition hover:bg-white/[0.07] hover:text-white"
            >
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        {/* --- Main Section --- */}
        <main className="flex-1 h-full min-w-0 overflow-hidden flex flex-col">
          
          {/* Header */}
          <header className="shrink-0 border-b border-white/10 px-8 py-5 flex items-center justify-between gap-6 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <button className="rounded-xl bg-white/10 p-2 md:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu size={16} />
              </button>
              <div>
                <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Workspace</h2>
                <p className="mt-1 hidden text-xs text-zinc-500 sm:block md:text-sm">Research, summarize, cite, and synthesize knowledge.</p>
              </div>
            </div>
            {session?.user?.email && (
              <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs md:block hidden text-zinc-300">
                {session.user.email}
              </div>
            )}
          </header>

          {/* Chat Area */}
          <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8">
            <div className="mx-auto flex h-full w-full max-w-4xl flex-col">
              
              <AnimatePresence>
                {messages.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mx-auto flex min-h-full w-full max-w-4xl flex-col items-center justify-center text-center pb-20"
                  >
                    <h3 className="text-5xl font-semibold tracking-tight">What should we research today?</h3>
                    <p className="mt-3 text-base text-zinc-500">Upload files, ask questions, or start deep research.</p>

                    <div className="mt-8 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
                      {[
                        { title: "Summarize uploaded notes", desc: "Extract key points from files automatically." },
                        { title: "Find key citations", desc: "Locate and format references perfectly." },
                        { title: "Start deep research", desc: "Comprehensive multi-step AI analysis." },
                      ].map((card, idx) => (
                        <button 
                          key={idx}
                          onClick={() => submitSuggestion(card.title)}
                          className="min-h-[120px] rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:bg-white/[0.08]"
                        >
                          <h4 className="text-sm font-medium text-white">{card.title}</h4>
                          <p className="mt-2 text-xs leading-5 text-zinc-500">{card.desc}</p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-6 pb-6">
                    {messages.map((msg, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.role === "user" ? (
                          <div className="max-w-[90%] rounded-2xl rounded-tr-sm bg-white px-5 py-3 text-sm leading-6 text-black md:max-w-[75%]">
                            {msg.content}
                          </div>
                        ) : (
                          <div className="group relative max-w-[90%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.045] p-5 text-sm leading-7 text-zinc-100 shadow-sm md:max-w-[80%]">
                            <button 
                              onClick={() => handleCopy(msg.content, index)}
                              className="absolute right-4 top-4 rounded-lg bg-black/20 p-2 text-zinc-400 opacity-0 transition-opacity hover:bg-black/40 hover:text-white group-hover:opacity-100"
                            >
                              {copiedIndex === index ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                            
                            <div className="prose prose-invert prose-sm max-w-none">
                              {msg.content.split('\n').map((line, i) => (
                                <p key={i} className="mb-2 last:mb-0">{line}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {isLoading && (
                      <motion.div 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="flex gap-1 rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.045] p-5">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: "0.2s" }} />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: "0.4s" }} />
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Input Area */}
          <div className="shrink-0 bg-gradient-to-t from-black via-black/95 to-transparent px-8 pb-8 pt-5">
            <div className="mx-auto w-full max-w-3xl">
              
              {/* File Pills */}
              {files.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs">
                      <span className="max-w-[150px] truncate">{f.name}</span>
                      <button onClick={() => removeFile(i)} className="ml-1 text-zinc-400 hover:text-white">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-[28px] border border-white/10 bg-zinc-950/95 p-4 shadow-2xl transition duration-300 focus-within:border-white/25">
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="custom-scrollbar min-h-[56px] w-full max-h-40 resize-none bg-transparent px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-zinc-500"
                  placeholder="Ask Varora anything..."
                />
                
                <div className="mt-3 flex items-center justify-between gap-3 px-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-8 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white lg:inline-flex"
                    >
                      <Upload size={14} /> <span>Upload</span>
                    </button>
                    
                    <button 
                      onClick={toggleDeepResearch}
                      className={`flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-medium transition ${deepResearch ? 'border-zinc-400 bg-white/20 text-white' : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white'}`}
                    >
                      <Sparkles size={14} className={deepResearch ? 'text-white' : ''} /> <span>Deep Research</span>
                    </button>
                    
                    <button 
                      onClick={handleExportMarkdown}
                      className="hidden h-8 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white lg:flex"
                    >
                      <Download size={14} /> <span>Export</span>
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => handleSend()}
                    disabled={!input.trim() && files.length === 0}
                    className="flex size-10 items-center justify-center gap-2 rounded-full bg-white text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
                  >
                    <ArrowUp size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* --- Right Panel (Desktop XL) --- */}
        <aside className="hidden xl:flex w-[340px] shrink-0 h-full flex-col border-l border-white/10 bg-black/55 px-5 py-6 backdrop-blur-xl">
          <div className="mb-6 space-y-1">
            <h3 className="text-base font-semibold text-white">Research Context</h3>
            <p className="text-xs leading-5 text-zinc-500">Files, citations, and session insights.</p>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto space-y-4 pr-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-600">Active Files</h4>
              <div className="mt-3 space-y-2">
                {files.length > 0 ? (
                  files.map((f, i) => (
                    <div key={i} className="flex flex-col rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                      <span className="truncate text-sm leading-6 text-zinc-300">{f.name}</span>
                      <span className="text-[10px] text-zinc-500">{f.type || "text/plain"}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm leading-6 text-zinc-500">No active files</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-600">Citations</h4>
              <div className="text-sm leading-6 text-zinc-500">
                No citations generated yet.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-600">Deep Research</h4>
              <div className="flex items-center gap-2 text-sm leading-6 text-zinc-300">
                <span className={`inline-block h-2 w-2 rounded-full ${deepResearch ? 'bg-white shadow-[0_0_8px_#ffffff]' : 'bg-zinc-600'}`}></span>
                {deepResearch ? 'Deep Research Mode' : 'Standard Research Mode'}
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {deepResearch ? 'Multi-step web search and analysis on.' : 'Fast standard AI responses.'}
              </p>
            </div>
            
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-600">Notes</h4>
              <div className="text-sm leading-6 text-zinc-500">
                No saved notes yet.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-600">Session Info</h4>
              <div className="mt-2 w-fit max-w-full truncate rounded-xl bg-black/30 px-3 py-2 text-xs text-zinc-400">
                {session?.user?.email || "ws_guest_session"}
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}