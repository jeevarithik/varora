"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  X,
} from "lucide-react";

export default function WorkspacePage() {
  const { data: session } = useSession();
  const router = useRouter();

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

  const normalizeText = (value) =>
    (value || "")
      .replace(/^[-*•\d.)\s]+/, "")
      .replace(/\s+/g, " ")
      .trim();

  const truncateText = (value, maxLength = 120) => {
    const cleaned = normalizeText(value);

    if (cleaned.length <= maxLength) {
      return cleaned;
    }

    return `${cleaned.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
  };

  const collectLines = (items) => {
    const seen = new Set();
    const results = [];

    items.forEach((item) => {
      if (!item) return;

      item.split("\n").forEach((line) => {
        const cleaned = normalizeText(line);

        if (!cleaned) return;

        const key = cleaned.toLowerCase();
        if (seen.has(key)) return;

        seen.add(key);
        results.push(cleaned);
      });
    });

    return results;
  };

  const getLatestAiMessage = () => {
    return [...messages].reverse().find((msg) => msg.role === "ai")?.content || "";
  };

  const latestAiText = getLatestAiMessage();
  const latestUserText =
    [...messages].reverse().find((msg) => msg.role === "user")?.content || "";

  const shouldShowKeyPoints = (() => {
    const text = latestUserText.toLowerCase();

    if (!text.trim()) return false;

    return /\b(explain|explanation|concept|concepts|define|definition|describe|description|what is|what are|why|how does|how do|difference between|compare|comparison|meaning of|break down)\b/i.test(
      text
    );
  })();

  const buildSummaryBullets = () => {
    const bullets = [];
    const seen = new Set();

    const push = (value) => {
      const cleaned = truncateText(value, 120);

      if (!cleaned) return;

      const key = cleaned.toLowerCase();
      if (seen.has(key)) return;

      seen.add(key);
      bullets.push(cleaned);
    };

    notes.forEach((note) => {
      const title = normalizeText(note.title) || "Untitled note";
      const lines = collectLines([note.content]);

      if (lines.length > 0) {
        push(`${title}: ${lines[0]}`);

        if (lines[1]) {
          push(lines[1]);
        }
      } else {
        push(title);
      }
    });

    if (bullets.length < 4) {
      files.forEach((file) => {
        const fileName = normalizeText(file.name) || "Uploaded file";
        const fileLines = collectLines([file.text]);

        if (!fileLines.length && fileName === "Uploaded file") return;

        push(fileLines[0] ? `${fileName}: ${fileLines[0]}` : fileName);
      });
    }

    if (bullets.length < 4 && latestAiText) {
      collectLines([latestAiText]).forEach((line) => {
        if (bullets.length < 6) {
          push(line);
        }
      });
    }

    if (bullets.length === 0) {
      return ["Upload notes or files to generate summarized bullet points."];
    }

    return bullets.slice(0, 6);
  };

  const buildSummaryText = () => {
    const segments = [];
    const seen = new Set();

    const push = (value) => {
      const cleaned = truncateText(value, 150);

      if (!cleaned) return;

      const key = cleaned.toLowerCase();
      if (seen.has(key)) return;

      seen.add(key);
      segments.push(cleaned);
    };

    notes.forEach((note) => {
      const title = normalizeText(note.title) || "Untitled note";
      const lines = collectLines([note.content]);

      if (lines.length > 0) {
        push(`${title} covers ${lines[0]}`);

        if (lines[1]) {
          push(lines[1]);
        }
      } else {
        push(title);
      }
    });

    files.forEach((file) => {
      const fileName = normalizeText(file.name) || "Uploaded file";
      const fileLines = collectLines([file.text]);

      if (fileLines.length > 0) {
        push(`${fileName} includes ${fileLines[0]}`);
      }
    });

    if (latestAiText) {
      collectLines([latestAiText]).forEach((line) => {
        push(line);
      });
    }

    if (segments.length === 0) {
      return "Upload notes or files to generate a summary.";
    }

    return segments.join(" ");
  };

  const buildKnowledgeGaps = () => {
    const gaps = [];
    const seen = new Set();

    const push = (value) => {
      const cleaned = truncateText(value, 110);

      if (!cleaned) return;

      const key = cleaned.toLowerCase();
      if (seen.has(key)) return;

      seen.add(key);
      gaps.push(cleaned);
    };

    notes.forEach((note) => {
      const title = normalizeText(note.title) || "Untitled note";
      const lines = collectLines([note.content]);
      let foundGap = false;

      lines.forEach((line) => {
        const lower = line.toLowerCase();
        const hasGapLanguage =
          /\?$/.test(line) ||
          /\b(missing|unclear|unknown|need|needs|follow up|todo|to do|gap|issue|risk|open|assumption)\b/.test(lower);

        if (hasGapLanguage) {
          foundGap = true;
          push(`${title}: ${line}`);
        }
      });

      if (!foundGap && lines.length > 0 && lines[0].length < 90) {
        push(`Expand ${title} with more supporting detail.`);
      }

      if (!foundGap && lines.length === 0) {
        push(`Add details to ${title} so the missing gaps are visible.`);
      }
    });

    files.forEach((file) => {
      const name = normalizeText(file.name) || "Uploaded file";
      const text = collectLines([file.text]);

      if (text.length === 0) {
        push(`Add notes for ${name} to connect it with the current gaps.`);
      }
    });

    if (gaps.length === 0) {
      if (notes.length === 0) {
        return ["Add notes to surface missing topics and open questions."];
      }

      push(`Add one follow-up note to clarify ${normalizeText(notes[0].title) || "the first note"}.`);

      if (files.length > 0) {
        push(`Link ${normalizeText(files[0].name) || "the uploaded file"} to a specific unresolved question.`);
      }
    }

    return gaps.slice(0, 6);
  };

  const extractCitationsFromText = (text) => {
    if (!text) return [];

    const lines = text.split("\n");
    const results = [];
    let current = null;

    const pushCurrent = () => {
      if (!current) return;

      const hasContent =
        current.title ||
        current.url ||
        current.snippet ||
        current.date ||
        current.link ||
        current.text;

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

      const match = line.match(
        /^(Source|Title|Link|URL|Snippet|Summary|Date|Citation|Quote|Text)\s*:\s*(.+)$/i
      );

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
      }
    });

    pushCurrent();
    return results;
  };

  const mergeUniqueCitations = (existing, incoming) => {
    const seen = new Set(
      existing.map(
        (c) => `${c.title}|${c.url || c.link}|${c.date}|${c.snippet || c.text}`
      )
    );

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

    const storedSessions = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.sessions) || "[]"
    );
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
    setActiveSection("new");

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
    const newFiles = Array.from(e.target.files || []);
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

    e.target.value = "";
  };

  const handleDrop = async (e) => {
    e.preventDefault();

    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (!droppedFiles.length) return;

    for (const file of droppedFiles) {
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

  const removeFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.replace("/");
    router.refresh();
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

    const offsets = [0];
    let result = "%PDF-1.4\n";

    const pageObjects = [];
    const contentObjects = [];

    pages.forEach((_, index) => {
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
    setDeepResearch((prev) => !prev);
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
          ? {
              ...note,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : note
      )
    );
  };

  const deleteNote = (id) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };
  const summaryBullets = buildSummaryBullets();
  const keyPoints = shouldShowKeyPoints ? summaryBullets : [];
  const knowledgeGaps = buildKnowledgeGaps();

  const renderSectionContent = () => {
    if (activeSection === "recent") {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
            <h3 className="text-lg font-semibold text-white">Recent Research</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Resume a saved research session.
            </p>
          </div>

          {recentSessions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/4 p-5 text-sm text-zinc-500">
              No recent research yet.
            </div>
          ) : (
            recentSessions.map((sessionItem) => (
              <button
                key={sessionItem.id}
                onClick={() => restoreSession(sessionItem, true)}
                className="flex w-full flex-col gap-2 rounded-2xl border border-white/10 bg-white/4 p-5 text-left text-sm text-white transition hover:bg-white/8"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-white">
                    {sessionItem.title}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {formatDate(sessionItem.updatedAt)}
                  </span>
                </div>

                <p className="text-xs leading-5 text-zinc-500">
                  {sessionItem.preview}
                </p>
              </button>
            ))
          )}
        </div>
      );
    }

    if (activeSection === "files") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/4 p-5">
            <div>
              <h3 className="text-lg font-semibold text-white">Uploaded Files</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Manage your workspace files.
              </p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 text-xs font-medium text-zinc-300 transition hover:bg-white/8 hover:text-white"
            >
              <Upload size={14} />
              <span>Upload</span>
            </button>
          </div>

          {files.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/4 p-5 text-sm text-zinc-500">
              No uploaded files yet.
            </div>
          ) : (
            files.map((fileItem, index) => (
              <div
                key={`${fileItem.name}-${index}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/4 p-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {fileItem.name}
                  </p>

                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                    <span>{fileItem.type || "text/plain"}</span>
                    <span>•</span>
                    <span>{formatDate(fileItem.uploadedAt)}</span>
                  </div>
                </div>

                <button
                  onClick={() => removeFile(index)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/2 text-zinc-400 transition hover:bg-white/8 hover:text-white"
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
          <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
            <h3 className="text-lg font-semibold text-white">Citations</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Sources captured during research.
            </p>
          </div>

          {citations.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/4 p-5 text-sm text-zinc-500">
              No citations generated yet.
            </div>
          ) : (
            citations.map((citation) => (
              <div
                key={citation.id}
                className="rounded-2xl border border-white/10 bg-white/4 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-white">
                    {citation.title}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {formatDate(citation.createdAt)}
                  </span>
                </div>

                {(citation.url || citation.link || citation.date) && (
                  <p className="mt-2 text-xs text-zinc-500">
                    {citation.date ? `Date ${citation.date}` : ""}
                    {citation.date && (citation.url || citation.link) ? " • " : ""}
                    {citation.url || citation.link}
                  </p>
                )}

                <p className="mt-2 text-xs leading-5 text-zinc-400">
                  {citation.snippet ||
                    citation.text ||
                    "Citation details captured from research."}
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
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/4 p-5">
            <div>
              <h3 className="text-lg font-semibold text-white">Saved Notes</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Capture insights as you go.
              </p>
            </div>

            <button
              onClick={addNote}
              className="flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 text-xs font-medium text-zinc-300 transition hover:bg-white/8 hover:text-white"
            >
              <Plus size={14} />
              <span>New Note</span>
            </button>
          </div>

          {notes.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/4 p-5 text-sm text-zinc-500">
              No saved notes yet.
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="rounded-2xl border border-white/10 bg-white/4 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <input
                    value={note.title}
                    onChange={(e) => updateNote(note.id, { title: e.target.value })}
                    className="w-full bg-transparent text-sm font-medium text-white outline-none"
                    placeholder="Note title"
                  />

                  <button
                    onClick={() => deleteNote(note.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/2 text-zinc-400 transition hover:bg-white/8 hover:text-white"
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
          <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
            <h3 className="text-lg font-semibold text-white">Settings</h3>
            <p className="mt-1 text-xs text-zinc-500">Workspace preferences.</p>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/4 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Research mode</p>
                <p className="text-xs text-zinc-500">
                  Switch between Standard and Deep Research.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDeepResearch(false)}
                  className={`flex h-8 items-center rounded-full border px-3 text-xs font-medium transition ${
                    !deepResearch
                      ? "border-zinc-400 bg-white/20 text-white"
                      : "border-white/10 bg-white/4 text-zinc-300 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  Standard
                </button>

                <button
                  onClick={() => setDeepResearch(true)}
                  className={`flex h-8 items-center rounded-full border px-3 text-xs font-medium transition ${
                    deepResearch
                      ? "border-zinc-400 bg-white/20 text-white"
                      : "border-white/10 bg-white/4 text-zinc-300 hover:bg-white/8 hover:text-white"
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

              <span className="text-xs text-zinc-300">
                {session?.user?.email || "Guest"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Clear workspace</p>
                <p className="text-xs text-zinc-500">
                  Reset chat, files, notes, and citations.
                </p>
              </div>

              <button
                onClick={resetWorkspace}
                className="flex h-8 items-center rounded-full border border-white/10 bg-white/4 px-4 text-xs font-medium text-zinc-300 transition hover:bg-white/8 hover:text-white"
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
      className="flex h-dvh w-screen overflow-hidden bg-black text-white"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-white/5 blur-[120px]"
      />

      <div className="flex h-full w-full overflow-hidden">
        <aside
          className={`absolute z-50 flex h-full w-75 shrink-0 flex-col border-r border-white/10 bg-black/60 px-5 py-6 backdrop-blur-xl transition-transform duration-300 md:relative md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-[-1] bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-white">
                Varora
              </h1>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                AI Research Workspace
              </p>
            </div>

            <button
              className="rounded-xl bg-white/10 p-2 md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <Menu size={16} />
            </button>
          </div>

          <button
            onClick={resetWorkspace}
            className="mb-10 mt-1 flex h-12 w-full shrink-0 items-center gap-3 rounded-2xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-black text-white">
              <Plus size={18} />
            </div>

            <span>New Research</span>
          </button>

          <nav className="custom-scrollbar flex-1 overflow-y-auto pr-2">
            <div className="mb-4 px-2 pt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-600">
              Workspace
            </div>

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
                  onClick={() => {
                    setActiveSection(item.section);
                    setSidebarOpen(false);
                  }}
                  className={`flex h-11 w-full items-center gap-3 rounded-xl px-4 text-sm transition hover:bg-white/[0.07] hover:text-white ${
                    activeSection === item.section
                      ? "bg-white/8 text-white"
                      : "text-zinc-400"
                  }`}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </nav>

          <div className="mt-auto pb-2">
            <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/4 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs text-white">
                {session?.user?.email?.[0]?.toUpperCase() || "G"}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                  User ID
                </p>
                <p className="truncate text-xs font-medium text-white">
                  {session?.user?.email || "Guest"}
                </p>
                <p className="truncate text-xs text-zinc-400">Pro Plan</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 text-sm text-zinc-400 shadow-[0_0_18px_rgba(239,68,68,0.22)] transition hover:bg-red-500/10 hover:text-red-300 hover:shadow-[0_0_24px_rgba(239,68,68,0.45)]"
            >
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center justify-between gap-6 border-b border-white/10 px-6 py-5 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <button
                className="rounded-xl bg-white/10 p-2 md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={16} />
              </button>

              <div>
                <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                  Workspace
                </h2>
                <p className="mt-1 hidden text-xs text-zinc-500 sm:block md:text-sm">
                  Research, summarize, cite, and synthesize knowledge.
                </p>
              </div>
            </div>

            {session?.user?.email && (
              <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-zinc-300 md:block">
                {session.user.email}
              </div>
            )}
          </header>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            multiple
          />

          {activeSection === "new" ? (
            <>
              <div className="min-h-0 flex-1 overflow-hidden px-8 py-8">
                <div className="grid h-full grid-cols-1 gap-8 lg:grid-cols-[1.25fr_0.85fr]">
                  <section className="flex min-h-0 flex-col rounded-[26px] border border-white/10 bg-white/[0.035] p-7 backdrop-blur-xl">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-600">
                          Summary
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-white">
                          Summarized Notes
                        </h3>
                      </div>

                      <button
                        onClick={() =>
                          submitSuggestion("Summarize the uploaded files clearly")
                        }
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/9 hover:text-white"
                      >
                        Generate
                      </button>
                    </div>

                    <div className="custom-scrollbar flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-black/30 p-6">
                      {messages.length === 0 && notes.length === 0 && files.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                          <Sparkles size={26} className="mb-4 text-zinc-500" />

                          <h4 className="text-xl font-semibold text-white">
                            Start your research
                          </h4>

                          <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                            Upload files or ask a question. Varora will generate
                            summary, keypoints, citations, and research context.
                          </p>

                          <div className="mt-6 grid w-full gap-3.5">
                            {[
                              "Summarize uploaded notes",
                              "Find key citations",
                              "Extract important keypoints",
                            ].map((item) => (
                              <button
                                key={item}
                                onClick={() => submitSuggestion(item)}
                                className="rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-left text-sm text-zinc-300 transition hover:bg-white/8 hover:text-white"
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                          <div className="space-y-5">
                            <AnimatePresence>
                              {messages.map((msg, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`flex ${
                                    msg.role === "user"
                                      ? "justify-end"
                                      : "justify-start"
                                  }`}
                                >
                                  {msg.role === "user" ? (
                                    <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-white px-5 py-4 text-sm leading-7 text-black shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                                      {msg.content}
                                    </div>
                                  ) : (
                                    <div className="group relative max-w-[90%] rounded-xl rounded-tl-sm border border-white/10 bg-white/4.5 p-5 text-sm leading-7 text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                                      <button
                                        onClick={() => handleCopy(msg.content, index)}
                                        className="absolute right-3 top-3 rounded-lg bg-black/30 p-2 text-zinc-400 opacity-0 transition hover:text-white group-hover:opacity-100"
                                      >
                                        {copiedIndex === index ? (
                                          <Check size={14} />
                                        ) : (
                                          <Copy size={14} />
                                        )}
                                      </button>

                                      <div className="pr-10">
                                        {msg.content.split("\n").map((line, i) => (
                                          <p key={i} className="mb-2 last:mb-0">
                                            {line}
                                          </p>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              ))}
                            </AnimatePresence>

                            {isLoading && (
                              <div className="flex justify-start">
                                <div className="flex gap-1 rounded-xl rounded-tl-sm border border-white/10 bg-white/4.5 px-5 py-4">
                                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500" />
                                  <span
                                    className="h-2 w-2 animate-bounce rounded-full bg-zinc-500"
                                    style={{ animationDelay: "0.2s" }}
                                  />
                                  <span
                                    className="h-2 w-2 animate-bounce rounded-full bg-zinc-500"
                                    style={{ animationDelay: "0.4s" }}
                                  />
                                </div>
                              </div>
                            )}

                            {messages.length === 0 && (
                              <div className="flex h-full min-h-55 items-center justify-center text-center">
                                <div>
                                  <Sparkles size={26} className="mx-auto mb-4 text-zinc-500" />
                                  <h4 className="text-xl font-semibold text-white">
                                    Start your research
                                  </h4>
                                  <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                                    Upload files or ask a question. Varora will keep the conversation here as your summary.
                                  </p>
                                </div>
                              </div>
                            )}

                            <div ref={messagesEndRef} />
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="flex min-h-0 flex-col rounded-[26px] border border-white/10 bg-linear-to-b from-white/4.5 via-white/3 to-black/20 p-7 backdrop-blur-xl">
                    <div className="mb-6 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">
                          Keypoints
                        </p>

                        <h3 className="mt-1 text-lg font-semibold tracking-tight text-white">
                          Important Points
                        </h3>
                      </div>

                      {shouldShowKeyPoints ? (
                        <button
                          onClick={() =>
                            submitSuggestion(
                              "Extract only the most important key points"
                            )
                          }
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/9 hover:text-white"
                        >
                          Extract
                        </button>
                      ) : (
                        <span className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                          Ask a concept or explanation question
                        </span>
                      )}
                    </div>

                    <div className="custom-scrollbar flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                      {shouldShowKeyPoints ? (
                        <div className="space-y-4.5">
                          {keyPoints.map((point, index) => (
                            <div
                              key={index}
                              className="rounded-2xl border border-white/10 bg-white/4.5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition hover:border-white/20 hover:bg-white/6"
                            >
                              <div className="mb-3 flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-black shadow-[0_0_14px_rgba(255,255,255,0.25)]">
                                  {index + 1}
                                </span>

                                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                                  Point
                                </p>
                              </div>

                              <p className="text-sm leading-7 text-zinc-200">
                                {point}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center text-center">
                          <div className="max-w-xs rounded-2xl border border-dashed border-white/10 bg-white/3 px-5 py-6">
                            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                              Idle
                            </p>
                            <p className="mt-2 text-sm leading-6 text-zinc-500">
                              Key points appear only for concept, explanation, or comparison questions.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>

              <div className="shrink-0 bg-linear-to-t from-black via-black/95 to-transparent px-8 pb-8 pt-4">
                <div className="mx-auto w-full max-w-5xl">
                  {files.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2.5">
                      {files.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/6 px-3 py-1.5 text-xs"
                        >
                            <span className="max-w-37.5 truncate">{f.name}</span>

                          <button
                            onClick={() => removeFile(i)}
                            className="ml-1 text-zinc-400 hover:text-white"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="rounded-[26px] border border-white/10 bg-zinc-950/95 p-6 shadow-2xl transition duration-300 focus-within:border-white/25">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      className="custom-scrollbar max-h-40 min-h-14 w-full resize-none bg-transparent px-4 py-4 text-sm leading-7 text-white outline-none placeholder:text-zinc-500"
                      placeholder="Ask Varora anything..."
                    />

                    <div className="mt-5 flex items-center justify-between gap-4 px-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/4 px-4 text-xs font-medium text-zinc-300 transition hover:bg-white/8 hover:text-white"
                        >
                          <Upload size={14} />
                          <span>Upload</span>
                        </button>

                        <button
                          onClick={toggleDeepResearch}
                          className={`flex h-9 items-center gap-2 rounded-lg border px-4 text-xs font-medium transition ${
                            deepResearch
                              ? "border-zinc-400 bg-white/20 text-white"
                              : "border-white/10 bg-white/4 text-zinc-300 hover:bg-white/8 hover:text-white"
                          }`}
                        >
                          <Sparkles size={14} />
                          <span>Deep Research</span>
                        </button>

                        <button
                          onClick={handleExportMarkdown}
                          className="hidden h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/4 px-4 text-xs font-medium text-zinc-300 transition hover:bg-white/8 hover:text-white lg:flex"
                        >
                          <Download size={14} />
                          <span>Export</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() && files.length === 0}
                        className="flex size-11 items-center justify-center rounded-lg bg-white text-black shadow-[0_0_18px_rgba(255,255,255,0.22)] transition hover:bg-zinc-200 hover:shadow-[0_0_28px_rgba(255,255,255,0.5)] disabled:opacity-50"
                      >
                        <ArrowUp size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
              <div className="mx-auto flex h-full w-full max-w-4xl flex-col">
                {renderSectionContent()}
              </div>
            </div>
          )}
        </main>

        <aside className="hidden h-full w-96 shrink-0 flex-col border-l border-white/10 bg-black/45 px-4 py-6 backdrop-blur-xl xl:ml-5 xl:flex">
          <div className="mb-6 space-y-1">
            <h3 className="text-sm font-semibold tracking-wide text-white">Research Context</h3>
            <p className="text-xs leading-5 text-zinc-500">
              Files, citations, knowledge gaps, and session insights.
            </p>
          </div>

          <div className="custom-scrollbar flex-1 space-y-4.5 overflow-y-auto pr-2">
            <div className="rounded-xl border border-white/10 bg-white/4 p-4.5">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-600">
                Active Files
              </h4>

              <div className="mt-3.5 space-y-2.5">
                {files.length > 0 ? (
                  files.map((f, i) => (
                    <div
                      key={i}
                      className="flex flex-col rounded-lg border border-white/10 bg-black/30 px-3 py-2.5"
                    >
                      <span className="truncate text-sm leading-6 text-zinc-300">
                        {f.name}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {f.type || "text/plain"}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm leading-6 text-zinc-500">
                    No active files
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/4 p-4.5">
              <div className="mb-3.5 flex items-center justify-between gap-3">
                <h4 className="text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-600">
                  Knowledge Gap
                </h4>

                <button
                  onClick={() =>
                    submitSuggestion(
                      "Analyze my notes and uploaded files to list the biggest knowledge gaps"
                    )
                  }
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-zinc-300 transition hover:bg-white/9 hover:text-white"
                >
                  Analyze
                </button>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/30 p-4.5">
                {knowledgeGaps.length > 0 ? (
                  <div className="space-y-2.5">
                    {knowledgeGaps.map((gap, index) => (
                      <div
                        key={`${gap}-${index}`}
                        className="flex gap-3 rounded-lg border border-white/10 bg-white/4 px-3 py-3"
                      >
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />

                        <p className="text-sm leading-6 text-zinc-300">{gap}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs leading-5 text-zinc-500">
                    Add notes to reveal the biggest gaps and open questions.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/4 p-4.5">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-600">
                Citation List
              </h4>

              <div className="mt-3.5 space-y-2.5">
                {citations.length > 0 ? (
                  citations.slice(0, 5).map((citation) => (
                    <div
                      key={citation.id}
                      className="flex flex-col rounded-lg border border-white/10 bg-black/30 px-3 py-2.5"
                    >
                      <span className="truncate text-sm leading-6 text-zinc-300">
                        {citation.title}
                      </span>

                      <span className="truncate text-[10px] text-zinc-500">
                        {citation.date
                          ? `Date ${citation.date}`
                          : citation.url || citation.link || "Citation"}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm leading-6 text-zinc-500">
                    No citations generated yet.
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/4 p-4.5">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-600">
                Deep Research
              </h4>

              <div className="flex items-center gap-2 text-sm leading-6 text-zinc-300">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    deepResearch
                      ? "bg-white shadow-[0_0_8px_#ffffff]"
                      : "bg-zinc-600"
                  }`}
                />
                {deepResearch ? "Deep Research Mode" : "Standard Research Mode"}
              </div>

              <p className="mt-1 text-xs text-zinc-500">
                {deepResearch
                  ? "Multi-step research and deeper analysis enabled."
                  : "Fast standard AI responses."}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/4 p-4.5">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-600">
                Notes
              </h4>

              <div className="mt-3 space-y-2.5">
                {notes.length > 0 ? (
                  notes.slice(0, 4).map((note) => (
                    <div
                      key={note.id}
                      className="flex flex-col rounded-lg border border-white/10 bg-black/30 px-3 py-2.5"
                    >
                      <span className="truncate text-sm leading-6 text-zinc-300">
                        {note.title}
                      </span>

                      <span className="text-[10px] text-zinc-500">
                        Updated {formatDate(note.updatedAt)}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm leading-6 text-zinc-500">
                    No saved notes yet.
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/4 p-4.5">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-600">
                Session Info
              </h4>

              <div className="mt-2 w-fit max-w-full truncate rounded-lg bg-black/30 px-3 py-2 text-xs text-zinc-400">
                {session?.user?.email || "ws_guest_session"}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}