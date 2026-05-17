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
  const [activeSection, setActiveSection] = useState("new");
  const [recentSessions, setRecentSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [citations, setCitations] = useState([]);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const hydratedRef = useRef(false);
  const lastProcessedMessageIndexRef = useRef(0);

  const STORAGE_KEYS = {
    sessions: "varora-workspace-sessions",
    current: "varora-workspace-current-session",
  };

  const createSessionId = () => {
    return `ws_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  };

  const getTitleFromMessages = (items) => {
    const firstUser = items.find((msg) => msg.role === "user" && msg.content.trim());
    if (firstUser) return firstUser.content.trim().slice(0, 48);
    return "Untitled Research";
  };

  const getPreviewFromMessages = (items) => {
    const firstMessage = items.find((msg) => msg.content && msg.content.trim());
    if (firstMessage) return firstMessage.content.trim().slice(0, 120);
    return "No messages yet.";
  };

  const formatDate = (iso) => {
    if (!iso) return "Unknown date";
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return "Unknown date";
    }
  };

  const extractCitationsFromText = (text) => {
    if (!text) return [];

    const lines = text.split("\n");
    const results = [];
    let current = null;

    const pushCurrent = () => {
      if (!current) return;
      const hasContent = current.title || current.url || current.snippet || current.date || current.link || current.text;
      if (hasContent) {
        results.push({
          id: createSessionId(),
          title: current.title || "Untitled Source",
          url: current.url || current.link || "",
          snippet: current.snippet || current.text || "",
          date: current.date || "",
          createdAt: new Date().toISOString(),
        });
      }
      current = null;
    };

    lines.forEach((rawLine) => {
      const line = rawLine.trim().replace(/^[-*•]+\s+/, "");
      if (!line) {
        pushCurrent();
        return;
      }

      const match = line.match(/^(Source|Title|Link|URL|Snippet|Summary|Date|Citation|Quote|Text)\s*:\s*(.+)$/i);
      if (match) {
        const key = match[1].toLowerCase();
        const value = match[2].trim();
        if (!current) current = {};

        if (key === "source" || key === "title") {
          current.title = current.title || value;
        } else if (key === "link" || key === "url") {
          current.url = value;
        } else if (key === "snippet" || key === "summary") {
          current.snippet = current.snippet ? `${current.snippet}\n${value}` : value;
        } else if (key === "date") {
          current.date = value;
        } else if (key === "citation" || key === "quote" || key === "text") {
          current.snippet = current.snippet ? `${current.snippet}\n${value}` : value;
        }

        return;
      }

      if (line.startsWith("http://") || line.startsWith("https://")) {
        if (!current) current = {};
        current.url = current.url || line;
        return;
      }
    });

    pushCurrent();
    return results;
  };

  const mergeUniqueCitations = (existing, incoming) => {
    const seen = new Set(existing.map((c) => `${c.title}|${c.url || c.link}|${c.date}|${c.snippet || c.text}`));
    const merged = [...existing];

    incoming.forEach((c) => {
      const key = `${c.title}|${c.url || c.link}|${c.date}|${c.snippet || c.text}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(c);
      }
    });

    return merged;
  };

  const resetWorkspace = () => {
    setMessages([]);
    setInput("");
    setFiles([]);
    setNotes([]);
    setCitations([]);
    setDeepResearch(false);
    setIsLoading(false);
    setActiveSection("new");
    setCurrentSessionId(createSessionId());
    lastProcessedMessageIndexRef.current = 0;
  };

  const restoreSession = (sessionData, switchToChat = true) => {
    const safeMessages = sessionData?.messages || [];
    const safeFiles = sessionData?.files || [];
    const safeCitations = sessionData?.citations || [];
    const safeNotes = sessionData?.notes || [];

    setMessages(safeMessages);
    setFiles(safeFiles);
    setCitations(safeCitations);
    setNotes(safeNotes);
    setDeepResearch(Boolean(sessionData?.deepResearch));
    setInput("");
    setIsLoading(false);
    setCurrentSessionId(sessionData?.id || createSessionId());
    lastProcessedMessageIndexRef.current = 0;

    if (switchToChat) {
      setActiveSection("new");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedSessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.sessions) || "[]");
    const storedCurrentId = localStorage.getItem(STORAGE_KEYS.current);

    setRecentSessions(storedSessions);

    if (storedCurrentId) {
      setCurrentSessionId(storedCurrentId);
      const found = storedSessions.find((session) => session.id === storedCurrentId);
      if (found) {
        restoreSession(found, false);
      }
    } else if (storedSessions.length > 0) {
      setCurrentSessionId(storedSessions[0].id);
      restoreSession(storedSessions[0], false);
    } else {
      setCurrentSessionId(createSessionId());
    }

    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;

    const sessionId = currentSessionId || createSessionId();
    if (!currentSessionId) {
      setCurrentSessionId(sessionId);
    }

    setRecentSessions((prev) => {
      const now = new Date().toISOString();
      const existingIndex = prev.findIndex((session) => session.id === sessionId);
      const existing = existingIndex >= 0 ? prev[existingIndex] : null;
      const createdAt = existing?.createdAt || now;

      const nextSession = {
        id: sessionId,
        title: getTitleFromMessages(messages),
        preview: getPreviewFromMessages(messages),
        createdAt,
        updatedAt: now,
        messages,
        files,
        citations,
        notes,
        deepResearch,
      };

      const remaining = prev.filter((session) => session.id !== sessionId);
      return [nextSession, ...remaining].slice(0, 25);
    });
  }, [messages, files, citations, notes, deepResearch, currentSessionId]);

  useEffect(() => {
    if (!hydratedRef.current || typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(recentSessions));
  }, [recentSessions]);

  useEffect(() => {
    if (!hydratedRef.current || typeof window === "undefined") return;
    if (currentSessionId) {
      localStorage.setItem(STORAGE_KEYS.current, currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (messages.length < lastProcessedMessageIndexRef.current) {
      lastProcessedMessageIndexRef.current = 0;
    }

    const newMessages = messages.slice(lastProcessedMessageIndexRef.current);
    const extracted = [];

    newMessages.forEach((msg) => {
      if (msg.role === "ai") {
        extracted.push(...extractCitationsFromText(msg.content));
      }
    });

    if (extracted.length > 0) {
      setCitations((prev) => mergeUniqueCitations(prev, extracted));
    }

    lastProcessedMessageIndexRef.current = messages.length;
  }, [messages]);

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
            uploadedAt: new Date().toISOString(),
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
              uploadedAt: new Date().toISOString(),
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

  const buildChatExportText = () => {
    const lines = [];

    messages.forEach((msg) => {
      const header = msg.role === "user" ? "You" : "Varora AI";
      lines.push(`${header}:`);
      lines.push(msg.content || "");
      lines.push("");
    });

    return lines.join("\n").trim();
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const createPdfBlob = (text) => {
    const escapePdfText = (value) =>
      value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

    const wrapLine = (line, maxLen) => {
      const chunks = [];
      let remaining = line;

      while (remaining.length > maxLen) {
        chunks.push(remaining.slice(0, maxLen));
        remaining = remaining.slice(maxLen);
      }

      chunks.push(remaining);
      return chunks;
    };

    const maxChars = 90;
    const lines = text.split("\n").flatMap((line) => wrapLine(line, maxChars));
    const linesPerPage = 48;
    const pages = [];

    for (let i = 0; i < lines.length; i += linesPerPage) {
      pages.push(lines.slice(i, i + linesPerPage));
    }

    if (pages.length === 0) {
      pages.push([""]);
    }

    const objects = [];
    const offsets = [0];
    let result = "%PDF-1.4\n";

    const pageObjects = [];
    const contentObjects = [];

    pages.forEach((pageLines, index) => {
      const pageNumber = 3 + index * 2;
      const contentNumber = 4 + index * 2;
      pageObjects.push(pageNumber);
      contentObjects.push(contentNumber);
    });

    const fontObjectNumber = 3 + pages.length * 2;

    const addObject = (content) => {
      offsets.push(result.length);
      result += content + "\n";
    };

    addObject("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj");
    addObject(
      `2 0 obj<< /Type /Pages /Kids [${pageObjects
        .map((num) => `${num} 0 R`)
        .join(" ")}] /Count ${pageObjects.length} >>endobj`
    );

    pages.forEach((pageLines, index) => {
      const pageNumber = pageObjects[index];
      const contentNumber = contentObjects[index];
      const streamLines = [];

      streamLines.push("BT");
      streamLines.push("/F1 10 Tf");
      streamLines.push("72 720 Td");

      pageLines.forEach((line, lineIndex) => {
        const escaped = escapePdfText(line || " ");
        streamLines.push(`(${escaped}) Tj`);
        if (lineIndex < pageLines.length - 1) {
          streamLines.push("0 -14 Td");
        }
      });

      streamLines.push("ET");
      const streamContent = streamLines.join("\n");

      addObject(
        `${pageNumber} 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentNumber} 0 R /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> >>endobj`
      );

      addObject(
        `${contentNumber} 0 obj<< /Length ${streamContent.length} >>stream\n${streamContent}\nendstream\nendobj`
      );
    });

    addObject(
      `${fontObjectNumber} 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj`
    );

    const xrefOffset = result.length;
    result += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;

    offsets.slice(1).forEach((offset) => {
      result += `${offset.toString().padStart(10, "0")} 00000 n \n`;
    });

    result += `trailer<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return new Blob([result], { type: "application/pdf" });
  };

  const handleExportMarkdown = () => {
    if (!messages.length) {
      alert("No messages to export yet.");
      return;
    }

    const format = window.prompt("Export format: pdf or txt", "pdf");
    if (!format) return;

    const normalized = format.trim().toLowerCase();
    const exportText = buildChatExportText();
    const dateStamp = new Date().toISOString().slice(0, 10);

    if (normalized.startsWith("t")) {
      const blob = new Blob([exportText], { type: "text/plain" });
      downloadBlob(blob, `varora-chat-${dateStamp}.txt`);
      return;
    }

    const pdfBlob = createPdfBlob(exportText);
    downloadBlob(pdfBlob, `varora-chat-${dateStamp}.pdf`);
  };

  const toggleDeepResearch = () => {
    setDeepResearch(!deepResearch);
  };

  const submitSuggestion = (text) => {
    handleSend(text);
  };

  const addNote = () => {
    const now = new Date().toISOString();
    setNotes((prev) => [
      {
        id: createSessionId(),
        title: "Untitled Note",
        content: "",
        updatedAt: now,
      },
      ...prev,
    ]);
  };

  const updateNote = (id, updates) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? { ...note, ...updates, updatedAt: new Date().toISOString() }
          : note
      )
    );
  };

  const deleteNote = (id) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const renderSectionContent = () => {
    if (activeSection === "recent") {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h3 className="text-lg font-semibold text-white">Recent Research</h3>
            <p className="mt-1 text-xs text-zinc-500">Resume a saved research session.</p>
          </div>

          {recentSessions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-zinc-500">
              No recent research yet.
            </div>
          ) : (
            recentSessions.map((sessionItem) => (
              <button
                key={sessionItem.id}
                onClick={() => restoreSession(sessionItem, true)}
                className="flex w-full flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left text-sm text-white transition hover:bg-white/[0.08] cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-white">{sessionItem.title}</span>
                  <span className="text-xs text-zinc-500">{formatDate(sessionItem.updatedAt)}</span>
                </div>
                <p className="text-xs leading-5 text-zinc-500">{sessionItem.preview}</p>
              </button>
            ))
          )}
        </div>
      );
    }

    if (activeSection === "files") {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Uploaded Files</h3>
              <p className="mt-1 text-xs text-zinc-500">Manage your workspace files.</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white cursor-pointer"
            >
              <Upload size={14} /> <span>Upload</span>
            </button>
          </div>

          {files.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-zinc-500">
              No uploaded files yet.
            </div>
          ) : (
            files.map((fileItem, index) => (
              <div
                key={`${fileItem.name}-${index}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{fileItem.name}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                    <span>{fileItem.type || "text/plain"}</span>
                    <span>•</span>
                    <span>{formatDate(fileItem.uploadedAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-zinc-400 transition hover:bg-white/[0.08] hover:text-white cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      );
    }

    if (activeSection === "citations") {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h3 className="text-lg font-semibold text-white">Citations</h3>
            <p className="mt-1 text-xs text-zinc-500">Sources captured during research.</p>
          </div>

          {citations.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-zinc-500">
              No citations generated yet.
            </div>
          ) : (
            citations.map((citation) => (
              <div key={citation.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-white">{citation.title}</span>
                  <span className="text-xs text-zinc-500">{formatDate(citation.createdAt)}</span>
                </div>
                {(citation.url || citation.link || citation.date) && (
                  <p className="mt-2 text-xs text-zinc-500">
                    {citation.date ? `Date ${citation.date}` : ""}
                    {citation.date && (citation.url || citation.link) ? " • " : ""}
                    {citation.url || citation.link}
                  </p>
                )}
                <p className="mt-2 text-xs leading-5 text-zinc-400">
                  {citation.snippet || citation.text || "Citation details captured from research."}
                </p>
              </div>
            ))
          )}
        </div>
      );
    }

    if (activeSection === "notes") {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Saved Notes</h3>
              <p className="mt-1 text-xs text-zinc-500">Capture insights as you go.</p>
            </div>
            <button
              onClick={addNote}
              className="flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white cursor-pointer"
            >
              <Plus size={14} /> <span>New Note</span>
            </button>
          </div>

          {notes.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-zinc-500">
              No saved notes yet.
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between gap-3">
                  <input
                    value={note.title}
                    onChange={(e) => updateNote(note.id, { title: e.target.value })}
                    className="w-full bg-transparent text-sm font-medium text-white outline-none"
                    placeholder="Note title"
                  />
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-zinc-400 transition hover:bg-white/[0.08] hover:text-white cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
                <textarea
                  value={note.content}
                  onChange={(e) => updateNote(note.id, { content: e.target.value })}
                  className="mt-3 w-full resize-none bg-transparent text-xs leading-5 text-zinc-400 outline-none"
                  rows={4}
                  placeholder="Write your note..."
                />
                <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-zinc-600">
                  Updated {formatDate(note.updatedAt)}
                </p>
              </div>
            ))
          )}
        </div>
      );
    }

    if (activeSection === "settings") {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h3 className="text-lg font-semibold text-white">Settings</h3>
            <p className="mt-1 text-xs text-zinc-500">Workspace preferences.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Research mode</p>
                <p className="text-xs text-zinc-500">Switch between Standard and Deep Research.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDeepResearch(false)}
                  className={`flex h-8 items-center rounded-full border px-3 text-xs font-medium transition cursor-pointer ${
                    !deepResearch
                      ? "border-zinc-400 bg-white/20 text-white"
                      : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  Standard
                </button>
                <button
                  onClick={() => setDeepResearch(true)}
                  className={`flex h-8 items-center rounded-full border px-3 text-xs font-medium transition cursor-pointer ${
                    deepResearch
                      ? "border-zinc-400 bg-white/20 text-white"
                      : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  Deep Research
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Theme</p>
                <p className="text-xs text-zinc-500">Display only.</p>
              </div>
              <span className="text-xs text-zinc-300">Minimal Black</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Account email</p>
                <p className="text-xs text-zinc-500">Active session identity.</p>
              </div>
              <span className="text-xs text-zinc-300">{session?.user?.email || "Guest"}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Clear workspace</p>
                <p className="text-xs text-zinc-500">Reset chat, files, notes, and citations.</p>
              </div>
              <button
                onClick={resetWorkspace}
                className="flex h-8 items-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
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
            onClick={resetWorkspace}
            className="mb-6 flex h-12 w-full items-center gap-3 rounded-2xl px-4 bg-white text-sm font-semibold text-black transition hover:bg-zinc-200 cursor-pointer"
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
                { icon: Clock, label: "Recent Research", section: "recent" },
                { icon: FileText, label: "Uploaded Files", section: "files" },
                { icon: BookOpen, label: "Citations", section: "citations" },
                { icon: Bookmark, label: "Saved Notes", section: "notes" },
                { icon: Settings, label: "Settings", section: "settings" },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSection(item.section)}
                  className="flex h-11 items-center gap-3 rounded-xl px-4 text-sm w-full text-zinc-400 transition hover:bg-white/[0.07] hover:text-white cursor-pointer"
                >
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

          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />

          {activeSection === "new" ? (
            <>
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
            </>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8">
              <div className="mx-auto flex h-full w-full max-w-4xl flex-col">
                {renderSectionContent()}
              </div>
            </div>
          )}
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
              <div className="mt-3 space-y-2">
                {citations.length > 0 ? (
                  citations.slice(0, 4).map((citation) => (
                    <div key={citation.id} className="flex flex-col rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                      <span className="truncate text-sm leading-6 text-zinc-300">{citation.title}</span>
                      <span className="text-[10px] text-zinc-500">
                        {citation.date ? `Date ${citation.date}` : citation.url || citation.link || "Citation"}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm leading-6 text-zinc-500">No citations generated yet.</span>
                )}
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
              <div className="mt-3 space-y-2">
                {notes.length > 0 ? (
                  notes.slice(0, 4).map((note) => (
                    <div key={note.id} className="flex flex-col rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                      <span className="truncate text-sm leading-6 text-zinc-300">{note.title}</span>
                      <span className="text-[10px] text-zinc-500">Updated {formatDate(note.updatedAt)}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm leading-6 text-zinc-500">No saved notes yet.</span>
                )}
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