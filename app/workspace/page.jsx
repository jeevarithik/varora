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
  Search,
  ChevronRight,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  Quote,
  MoreHorizontal,
  SlidersHorizontal,
  Star,
  RefreshCw,
  ChevronDown,
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
  const [currentTime, setCurrentTime] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("GPT-4o");
  const [deepResearchOpen, setDeepResearchOpen] = useState(false);

  useEffect(() => {
    setCurrentTime(
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }, []);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const hydratedRef = useRef(false);
  const lastProcessedMessageIndexRef = useRef(0);

  const STORAGE_KEYS = {
    sessions: "varora-workspace-sessions",
    current: "varora-workspace-current-session",
  };

  const createSessionId = () =>
    `ws_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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
      return new Date(iso).toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Unknown date";
    }
  };

  const formatDateLong = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const normalizeText = (value) =>
    (value || "")
      .replace(/^[-*•\d.)\s]+/, "")
      .replace(/\s+/g, " ")
      .trim();

  const truncateText = (value, maxLength = 120) => {
    const cleaned = normalizeText(value);
    if (cleaned.length <= maxLength) return cleaned;
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

  const getLatestAiMessage = () =>
    [...messages].reverse().find((msg) => msg.role === "ai")?.content || "";

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
      const cleaned = normalizeText(value);
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
        if (lines[1]) push(lines[1]);
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
        if (bullets.length < 6) push(line);
      });
    }
    if (bullets.length === 0) {
      return ["Upload notes or files to generate summarized bullet points."];
    }
    return bullets.slice(0, 6);
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
      if (notes.length === 0) return ["Add notes to surface missing topics and open questions."];
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
      if (!line) { pushCurrent(); return; }
      const match = line.match(/^(Source|Title|Link|URL|Snippet|Summary|Date|Citation|Quote|Text)\s*:\s*(.+)$/i);
      if (match) {
        const key = match[1].toLowerCase();
        const value = match[2].trim();
        if (!current) current = {};
        if (key === "source" || key === "title") current.title = current.title || value;
        else if (key === "link" || key === "url") current.url = value;
        else if (key === "snippet" || key === "summary") current.snippet = current.snippet ? `${current.snippet}\n${value}` : value;
        else if (key === "date") current.date = value;
        else if (key === "citation" || key === "quote" || key === "text") current.snippet = current.snippet ? `${current.snippet}\n${value}` : value;
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
    const seen = new Set(existing.map((c) => `${c.title}|${c.url || c.link}|${c.date}|${c.snippet || c.text}`));
    const merged = [...existing];
    incoming.forEach((c) => {
      const key = `${c.title}|${c.url || c.link}|${c.date}|${c.snippet || c.text}`;
      if (!seen.has(key)) { seen.add(key); merged.push(c); }
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
    if (switchToChat) setActiveSection("new");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  // Monitor session changes and clear localStorage if user changes
  useEffect(() => {
    if (!session?.user?.email) return;
    
    const storedUserEmail = sessionStorage.getItem("varora_last_user_email");
    
    if (storedUserEmail && storedUserEmail !== session.user.email) {
      // User has changed, clear all user-specific data
      localStorage.removeItem(STORAGE_KEYS.sessions);
      localStorage.removeItem(STORAGE_KEYS.current);
      setRecentSessions([]);
      setMessages([]);
      setCurrentSessionId(createSessionId());
    }
    
    // Store current user email in sessionStorage for next login check
    sessionStorage.setItem("varora_last_user_email", session.user.email);
  }, [session?.user?.email]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedSessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.sessions) || "[]");
    const storedCurrentId = localStorage.getItem(STORAGE_KEYS.current);
    setRecentSessions(storedSessions);
    if (storedCurrentId) {
      setCurrentSessionId(storedCurrentId);
      const found = storedSessions.find((s) => s.id === storedCurrentId);
      if (found) restoreSession(found, false);
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
    if (!currentSessionId) setCurrentSessionId(sessionId);
    setRecentSessions((prev) => {
      const now = new Date().toISOString();
      const existingIndex = prev.findIndex((s) => s.id === sessionId);
      const existing = existingIndex >= 0 ? prev[existingIndex] : null;
      const createdAt = existing?.createdAt || now;
      const nextSession = {
        id: sessionId,
        title: getTitleFromMessages(messages),
        preview: getPreviewFromMessages(messages),
        createdAt,
        updatedAt: now,
        messages, files, citations, notes, deepResearch,
      };
      const remaining = prev.filter((s) => s.id !== sessionId);
      return [nextSession, ...remaining].slice(0, 25);
    });
  }, [messages, files, citations, notes, deepResearch, currentSessionId]);

  useEffect(() => {
    if (!hydratedRef.current || typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(recentSessions));
  }, [recentSessions]);

  useEffect(() => {
    if (!hydratedRef.current || typeof window === "undefined") return;
    if (currentSessionId) localStorage.setItem(STORAGE_KEYS.current, currentSessionId);
  }, [currentSessionId]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (messages.length < lastProcessedMessageIndexRef.current) lastProcessedMessageIndexRef.current = 0;
    const newMessages = messages.slice(lastProcessedMessageIndexRef.current);
    const extracted = [];
    newMessages.forEach((msg) => {
      if (msg.role === "ai") extracted.push(...extractCitationsFromText(msg.content));
    });
    if (extracted.length > 0) setCitations((prev) => mergeUniqueCitations(prev, extracted));
    lastProcessedMessageIndexRef.current = messages.length;
  }, [messages]);

  // Clear search query when switching sections
  useEffect(() => {
    setSearchQuery("");
  }, [activeSection]);

  const handleSend = async (forcedInitialMessage = null) => {
    const textToSend = forcedInitialMessage || input;
    if (!textToSend.trim() && files.length === 0) return;
    const userMessage = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setActiveSection("new");
    try {
      const fileText = files.map((file) => file.text || "").filter(Boolean).join("\n\n");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          fileText,
          fileChunks: files.flatMap((file) => file.chunks || []),
          deepResearch,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: data.reply || data.message || "No response received." },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Sorry, Varora AI had trouble responding. Please check the API key or server route and try again." },
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
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        setFiles((prev) => [
          ...prev,
          { name: file.name, type: file.type, text: data.text || "", chunks: data.chunks || [], file, uploadedAt: new Date().toISOString() },
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
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        setFiles((prev) => [
          ...prev,
          { name: file.name, type: file.type, text: data.text || "", chunks: data.chunks || [], file, uploadedAt: new Date().toISOString() },
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
    // Clear all user-specific data from localStorage before signing out
    localStorage.removeItem(STORAGE_KEYS.sessions);
    localStorage.removeItem(STORAGE_KEYS.current);
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
      while (remaining.length > maxLen) { chunks.push(remaining.slice(0, maxLen)); remaining = remaining.slice(maxLen); }
      chunks.push(remaining);
      return chunks;
    };
    const maxChars = 90;
    const lines = text.split("\n").flatMap((line) => wrapLine(line, maxChars));
    const linesPerPage = 48;
    const pages = [];
    for (let i = 0; i < lines.length; i += linesPerPage) pages.push(lines.slice(i, i + linesPerPage));
    if (pages.length === 0) pages.push([""]);
    const offsets = [0];
    let result = "%PDF-1.4\n";
    const pageObjects = [];
    const contentObjects = [];
    pages.forEach((_, index) => {
      pageObjects.push(3 + index * 2);
      contentObjects.push(4 + index * 2);
    });
    const fontObjectNumber = 3 + pages.length * 2;
    const addObject = (content) => { offsets.push(result.length); result += content + "\n"; };
    addObject("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj");
    addObject(`2 0 obj<< /Type /Pages /Kids [${pageObjects.map((n) => `${n} 0 R`).join(" ")}] /Count ${pageObjects.length} >>endobj`);
    pages.forEach((pageLines, index) => {
      const pageNumber = pageObjects[index];
      const contentNumber = contentObjects[index];
      const streamLines = ["BT", "/F1 10 Tf", "72 720 Td"];
      pageLines.forEach((line, lineIndex) => {
        streamLines.push(`(${escapePdfText(line || " ")}) Tj`);
        if (lineIndex < pageLines.length - 1) streamLines.push("0 -14 Td");
      });
      streamLines.push("ET");
      const streamContent = streamLines.join("\n");
      addObject(`${pageNumber} 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentNumber} 0 R /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> >>endobj`);
      addObject(`${contentNumber} 0 obj<< /Length ${streamContent.length} >>stream\n${streamContent}\nendstream\nendobj`);
    });
    addObject(`${fontObjectNumber} 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj`);
    const xrefOffset = result.length;
    result += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => { result += `${offset.toString().padStart(10, "0")} 00000 n \n`; });
    result += `trailer<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return new Blob([result], { type: "application/pdf" });
  };

  const handleExportMarkdown = () => {
    if (!messages.length) { alert("No messages to export yet."); return; }
    const format = window.prompt("Export format: pdf or txt", "pdf");
    if (!format) return;
    const normalized = format.trim().toLowerCase();
    const exportText = buildChatExportText();
    const dateStamp = new Date().toISOString().slice(0, 10);
    if (normalized.startsWith("t")) {
      downloadBlob(new Blob([exportText], { type: "text/plain" }), `varora-chat-${dateStamp}.txt`);
      return;
    }
    downloadBlob(createPdfBlob(exportText), `varora-chat-${dateStamp}.pdf`);
  };

  const toggleDeepResearch = () => setDeepResearch((prev) => !prev);
  const submitSuggestion = (text) => handleSend(text);

  const addNote = () => {
    const now = new Date().toISOString();
    setNotes((prev) => [{ id: createSessionId(), title: "Untitled Note", content: "", updatedAt: now }, ...prev]);
  };

  const updateNote = (id, updates) => {
    setNotes((prev) =>
      prev.map((note) => note.id === id ? { ...note, ...updates, updatedAt: new Date().toISOString() } : note)
    );
  };

  const deleteNote = (id) => setNotes((prev) => prev.filter((note) => note.id !== id));

  const summaryBullets = buildSummaryBullets();
  const keyPoints = shouldShowKeyPoints ? summaryBullets : [];
  const knowledgeGaps = buildKnowledgeGaps();

  // Parse AI message into structured doc format
  const parseAiMessageToDoc = (content) => {
    const lines = content.split("\n").filter((l) => l.trim());
    const sections = [];
    let currentSection = null;
    let intro = "";
    let introSet = false;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const isBold = /^\*\*(.+)\*\*$/.test(trimmed);
      const isHeading = /^#{1,3}\s/.test(trimmed) || isBold;
      const isBullet = /^[-*•]\s/.test(trimmed);
      const isNumbered = /^\d+\.\s/.test(trimmed);

      if (isHeading) {
        const headingText = trimmed.replace(/^#{1,3}\s/, "").replace(/^\*\*|\*\*$/g, "");
        currentSection = { heading: headingText, bullets: [], text: [] };
        sections.push(currentSection);
        introSet = true;
      } else if (isBullet || isNumbered) {
        const bulletText = trimmed.replace(/^[-*•]\s/, "").replace(/^\d+\.\s/, "");
        if (!currentSection) {
          currentSection = { heading: null, bullets: [], text: [] };
          sections.push(currentSection);
        }
        currentSection.bullets.push(bulletText);
        introSet = true;
      } else {
        if (!introSet && !currentSection) {
          intro += (intro ? " " : "") + trimmed;
        } else {
          if (!currentSection) {
            currentSection = { heading: null, bullets: [], text: [] };
            sections.push(currentSection);
          }
          currentSection.text.push(trimmed);
        }
      }
    });

    return { intro, sections };
  };

  const renderDocMessage = (content, index) => {
    const { intro, sections } = parseAiMessageToDoc(content);
    const hasStructure = sections.length > 0;

    return (
      <div className="rounded-2xl border border-[#2a2a2a] bg-[#111111] overflow-hidden">
        {/* Doc header */}
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4 border-b border-[#1e1e1e]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/8">
              <Star size={11} className="text-zinc-300" />
            </div>
            <span className="text-sm font-semibold text-white">AI Research Summary</span>
            <span className="text-xs text-zinc-500">{currentTime}</span>
          </div>
          <button
            onClick={() => handleCopy(content, index)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/8 hover:text-zinc-300"
          >
            {copiedIndex === index ? <Check size={13} /> : <MoreHorizontal size={15} />}
          </button>
        </div>

        {/* Doc body */}
        <div className="px-6 py-5 space-y-5">
          {intro && <p className="text-sm leading-7 text-zinc-300">{intro}</p>}

          {hasStructure ? (
            sections.map((section, si) => (
              <div key={si} className="space-y-2.5">
                {section.heading && (
                  <h4 className="text-sm font-semibold text-white">{section.heading}</h4>
                )}
                {section.text.map((t, ti) => (
                  <p key={ti} className="text-sm leading-7 text-zinc-300">{t}</p>
                ))}
                {section.bullets.length > 0 && (
                  <ul className="space-y-1.5 pl-1">
                    {section.bullets.map((b, bi) => {
                      // Check for bold prefix pattern like **Word:** rest
                      const boldMatch = b.match(/^\*\*(.+?)\*\*\s*(.*)$/);
                      return (
                        <li key={bi} className="flex gap-2.5 text-sm leading-6 text-zinc-300">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" />
                          <span>
                            {boldMatch ? (
                              <>
                                <span className="font-semibold text-white">{boldMatch[1]}:</span>{" "}
                                {boldMatch[2]}
                              </>
                            ) : b}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))
          ) : (
            <div className="text-sm leading-7 text-zinc-300 whitespace-pre-wrap">{content}</div>
          )}
        </div>

        {/* Doc footer actions */}
        <div className="flex items-center justify-between gap-4 px-6 pb-5 pt-1">
          <div className="flex items-center gap-1">
            <button className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/8 hover:text-zinc-300">
              <ThumbsUp size={13} />
            </button>
            <button className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/8 hover:text-zinc-300">
              <ThumbsDown size={13} />
            </button>
            <button className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/8 hover:text-zinc-300">
              <Bookmark size={13} />
            </button>
            <button
              onClick={() => handleCopy(content, index)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/8 hover:text-zinc-300"
            >
              {copiedIndex === index ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
          <button className="flex h-8 items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3.5 text-xs font-medium text-zinc-300 transition hover:border-[#333] hover:bg-[#222] hover:text-white">
            <Quote size={12} />
            <span>Cite Sources</span>
          </button>
        </div>
      </div>
    );
  };

  const renderSectionContent = () => {
    if (activeSection === "recent") {
      const filteredSessions = recentSessions.filter((session) =>
        session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.preview.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return (
        <div className="space-y-3">
          <div className="rounded-xl border border-[#1e1e1e] bg-[#111] p-5">
            <h3 className="text-base font-semibold text-white">Recent Research</h3>
            <p className="mt-1 text-xs text-zinc-500">Resume a saved research session.</p>
          </div>
          {recentSessions.length > 0 && (
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-2.5 text-zinc-600" />
              <input
                type="text"
                placeholder="Search research..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#111] pl-10 pr-4 py-2 text-sm text-zinc-300 placeholder-zinc-600 outline-none transition focus:border-[#333] focus:bg-[#161616]"
              />
            </div>
          )}
          {filteredSessions.length === 0 ? (
            <div className="rounded-xl border border-[#1e1e1e] bg-[#111] p-5 text-sm text-zinc-500">
              {recentSessions.length === 0 ? "No recent research yet." : "No research matches your search."}
            </div>
          ) : (
            filteredSessions.map((sessionItem) => (
              <button
                key={sessionItem.id}
                onClick={() => restoreSession(sessionItem, true)}
                className="flex w-full flex-col gap-2 rounded-xl border border-[#1e1e1e] bg-[#111] p-5 text-left transition hover:bg-[#161616] hover:border-[#2a2a2a]"
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
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-[#1e1e1e] bg-[#111] p-5">
            <div>
              <h3 className="text-base font-semibold text-white">Uploaded Files</h3>
              <p className="mt-1 text-xs text-zinc-500">Manage your workspace files.</p>
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="flex h-8 items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3.5 text-xs font-medium text-zinc-300 transition hover:bg-[#222] hover:text-white">
              <Upload size={13} /><span>Upload</span>
            </button>
          </div>
          {files.length === 0 ? (
            <div className="rounded-xl border border-[#1e1e1e] bg-[#111] p-5 text-sm text-zinc-500">No uploaded files yet.</div>
          ) : (
            files.map((fileItem, index) => (
              <div key={`${fileItem.name}-${index}`} className="flex items-center justify-between gap-4 rounded-xl border border-[#1e1e1e] bg-[#111] p-5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{fileItem.name}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                    <span>{fileItem.type || "text/plain"}</span>
                    <span>•</span>
                    <span>{formatDate(fileItem.uploadedAt)}</span>
                  </div>
                </div>
                <button onClick={() => removeFile(index)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2a2a2a] text-zinc-500 transition hover:bg-[#1a1a1a] hover:text-white">
                  <X size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      );
    }

    if (activeSection === "citations") {
      return (
        <div className="space-y-3">
          <div className="rounded-xl border border-[#1e1e1e] bg-[#111] p-5">
            <h3 className="text-base font-semibold text-white">Citations</h3>
            <p className="mt-1 text-xs text-zinc-500">Sources captured during research.</p>
          </div>
          {citations.length === 0 ? (
            <div className="rounded-xl border border-[#1e1e1e] bg-[#111] p-5 text-sm text-zinc-500">No citations generated yet.</div>
          ) : (
            citations.map((citation) => (
              <div key={citation.id} className="rounded-xl border border-[#1e1e1e] bg-[#111] p-5">
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
                <p className="mt-2 text-xs leading-5 text-zinc-400">{citation.snippet || citation.text || "Citation details captured from research."}</p>
              </div>
            ))
          )}
        </div>
      );
    }

    if (activeSection === "notes") {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-[#1e1e1e] bg-[#111] p-5">
            <div>
              <h3 className="text-base font-semibold text-white">Saved Notes</h3>
              <p className="mt-1 text-xs text-zinc-500">Capture insights as you go.</p>
            </div>
            <button onClick={addNote} className="flex h-8 items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3.5 text-xs font-medium text-zinc-300 transition hover:bg-[#222] hover:text-white">
              <Plus size={13} /><span>New Note</span>
            </button>
          </div>
          {notes.length === 0 ? (
            <div className="rounded-xl border border-[#1e1e1e] bg-[#111] p-5 text-sm text-zinc-500">No saved notes yet.</div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="rounded-xl border border-[#1e1e1e] bg-[#111] p-5">
                <div className="flex items-center justify-between gap-3">
                  <input value={note.title} onChange={(e) => updateNote(note.id, { title: e.target.value })} className="w-full bg-transparent text-sm font-medium text-white outline-none" placeholder="Note title" />
                  <button onClick={() => deleteNote(note.id)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#2a2a2a] text-zinc-500 transition hover:bg-[#1a1a1a] hover:text-white">
                    <X size={12} />
                  </button>
                </div>
                <textarea value={note.content} onChange={(e) => updateNote(note.id, { content: e.target.value })} className="mt-3 w-full resize-none bg-transparent text-xs leading-5 text-zinc-400 outline-none" rows={4} placeholder="Write your note..." />
                <p className="mt-2 text-[10px] uppercase tracking-wider text-zinc-600">Updated {formatDate(note.updatedAt)}</p>
              </div>
            ))
          )}
        </div>
      );
    }

    if (activeSection === "settings") {
      return (
        <div className="space-y-3">
          <div className="rounded-xl border border-[#1e1e1e] bg-[#111] p-5">
            <h3 className="text-base font-semibold text-white">Settings</h3>
            <p className="mt-1 text-xs text-zinc-500">Workspace preferences.</p>
          </div>
          <div className="space-y-4 rounded-xl border border-[#1e1e1e] bg-[#111] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Research mode</p>
                <p className="text-xs text-zinc-500">Switch between Standard and Deep Research.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setDeepResearch(false)} className={`flex h-8 items-center rounded-lg border px-3 text-xs font-medium transition ${!deepResearch ? "border-zinc-500 bg-white/10 text-white" : "border-[#2a2a2a] text-zinc-400 hover:text-white"}`}>Standard</button>
                <button onClick={() => setDeepResearch(true)} className={`flex h-8 items-center rounded-lg border px-3 text-xs font-medium transition ${deepResearch ? "border-zinc-500 bg-white/10 text-white" : "border-[#2a2a2a] text-zinc-400 hover:text-white"}`}>Deep Research</button>
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
              <button onClick={resetWorkspace} className="flex h-8 items-center rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3.5 text-xs font-medium text-zinc-300 transition hover:bg-[#222] hover:text-white">Clear</button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const navItems = [
    { icon: Clock, label: "Recent Research", section: "recent" },
    { icon: FileText, label: "Uploaded Files", section: "files" },
    { icon: BookOpen, label: "Citations", section: "citations" },
    { icon: Bookmark, label: "Saved Notes", section: "notes" },
    { icon: Settings, label: "Settings", section: "settings" },
  ];

  const sessionStartedAt = recentSessions.find((s) => s.id === currentSessionId)?.createdAt;

  return (
    <div
      className="flex h-dvh w-screen overflow-hidden bg-[#0a0a0a] text-white"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}
    >
      <div className="flex h-full w-full overflow-hidden">

        {/* ── SIDEBAR ── */}
        <aside
          className={`absolute z-50 flex h-full w-[240px] shrink-0 flex-col border-r border-[#1a1a1a] bg-[#0d0d0d] px-4 py-5 transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          {sidebarOpen && (
            <div className="fixed inset-0 z-[-1] bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
          )}

          {/* Logo */}
          <div className="mb-6 flex items-center gap-2.5 px-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white">
              <Star size={14} className="text-black fill-black" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">Varora</span>
          </div>

          {/* New Research */}
          <button
            onClick={resetWorkspace}
            className="mb-6 flex h-10 w-full items-center gap-2.5 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 text-sm font-medium text-white transition hover:bg-[#222] hover:border-[#333] active:scale-[0.98]"
          >
            <Plus size={15} />
            <span>New Research</span>
          </button>

          {/* Nav */}
          <div className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            WORKSPACE
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto">
            {navItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => { setActiveSection(item.section); setSidebarOpen(false); }}
                className={`flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm transition ${
                  activeSection === item.section
                    ? "bg-white/8 text-white"
                    : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
                }`}
              >
                <item.icon size={15} className="shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User card */}
          <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
            <button className="flex w-full items-center gap-3 rounded-xl p-3 transition hover:bg-white/[0.04]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-xs font-bold text-white">
                {session?.user?.email?.[0]?.toUpperCase() || "G"}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-xs font-medium text-white leading-tight">
                  {session?.user?.email || "Guest"}
                </p>
                <p className="text-[11px] text-zinc-500">Pro Plan</p>
              </div>
              <ChevronRight size={14} className="text-zinc-600" />
            </button>

            <button
              onClick={handleLogout}
              className="mt-1 flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-sm text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-300"
            >
              <LogOut size={14} />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">

          {/* Header */}
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#1a1a1a] bg-[#0d0d0d] px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-white md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={16} />
              </button>
              <div>
                <h2 className="text-base font-bold tracking-tight text-white">Workspace</h2>
                <p className="text-xs text-zinc-500 hidden sm:block">Research, summarize, cite, and synthesize knowledge.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="hidden md:flex items-center gap-2 h-9 rounded-lg border border-[#2a2a2a] bg-[#161616] px-3 text-xs text-zinc-400 w-52 transition focus-within:border-[#333] focus-within:text-white">
                <Search size={13} className="shrink-0" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search research..."
                  className="bg-transparent outline-none w-full text-white placeholder:text-zinc-500"
                />
              </div>

              {/* Model selector */}
              <div className="relative">
                <button
                  onClick={() => setModelDropdownOpen((p) => !p)}
                  className="flex h-9 items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#161616] px-3 text-xs font-medium text-zinc-300 transition hover:border-[#333] hover:bg-[#1a1a1a] hover:text-white"
                >
                  <Star size={12} className="text-zinc-400" />
                  <span>{selectedModel}</span>
                  <ChevronDown size={12} className="text-zinc-500" />
                </button>
                {modelDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-xl border border-[#2a2a2a] bg-[#111] p-1 shadow-2xl">
                    {["GPT-4o", "Claude 3.5", "Gemini 1.5"].map((m) => (
                      <button
                        key={m}
                        onClick={() => { setSelectedModel(m); setModelDropdownOpen(false); }}
                        className={`flex w-full items-center rounded-lg px-3 py-2 text-xs transition ${selectedModel === m ? "bg-white/8 text-white" : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#161616] text-zinc-400 transition hover:bg-[#1a1a1a] hover:text-white">
                <MoreVertical size={15} />
              </button>
            </div>
          </header>

          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />

          {activeSection === "new" ? (
            <>
              {/* Chat area */}
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <div className="mx-auto w-full max-w-3xl space-y-4">
                  {messages.length === 0 && !isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[420px] text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#161616] border border-[#2a2a2a] mb-4">
                        <Sparkles size={20} className="text-zinc-400" />
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">Start your research</h4>
                      <p className="text-sm leading-6 text-zinc-500 max-w-sm mb-6">
                        Upload files or ask a question. Varora will generate summary, keypoints, citations, and research context.
                      </p>
                      <div className="grid w-full max-w-sm gap-2">
                        {["Summarize uploaded notes", "Find key citations", "Extract important keypoints"].map((item) => (
                          <button
                            key={item}
                            onClick={() => submitSuggestion(item)}
                            className="rounded-xl border border-[#2a2a2a] bg-[#111] px-4 py-3 text-left text-sm text-zinc-400 transition hover:bg-[#161616] hover:border-[#333] hover:text-zinc-200"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {messages.map((msg, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {msg.role === "user" ? (
                            <div className="flex justify-end mb-2">
                              <div className="max-w-[75%] rounded-2xl rounded-tr-md bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-3 text-sm leading-6 text-zinc-100">
                                {msg.content}
                              </div>
                            </div>
                          ) : (
                            renderDocMessage(msg.content, index)
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}

                  {isLoading && (
                    <div className="rounded-2xl border border-[#2a2a2a] bg-[#111] px-6 py-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/8">
                          <Star size={10} className="text-zinc-300" />
                        </div>
                        <span className="text-sm font-semibold text-white">AI Research Summary</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-600" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-600" style={{ animationDelay: "0.15s" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-600" style={{ animationDelay: "0.3s" }} />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input bar */}
              <div className="shrink-0 border-t border-[#1a1a1a] bg-[#0d0d0d] px-6 py-4">
                <div className="mx-auto w-full max-w-3xl">
                  {files.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {files.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#161616] px-3 py-1.5 text-xs font-medium text-zinc-300">
                          <span className="max-w-[140px] truncate">{f.name}</span>
                          <button onClick={() => removeFile(i)} className="text-zinc-500 transition hover:text-white"><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="rounded-xl border border-[#2a2a2a] bg-[#111] transition focus-within:border-[#3a3a3a]">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                      }}
                      className="max-h-36 min-h-[52px] w-full resize-none bg-transparent px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-zinc-600"
                      placeholder="Ask Varora anything..."
                    />

                    <div className="flex items-center justify-between gap-3 px-3 pb-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-medium text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-200"
                        >
                          <Upload size={13} />
                          <span>Upload</span>
                        </button>

                        <button
                          onClick={toggleDeepResearch}
                          className={`flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-medium transition ${
                            deepResearch
                              ? "bg-white/8 text-white"
                              : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
                          }`}
                        >
                          <Sparkles size={13} />
                          <span>Deep Research</span>
                        </button>

                        <button
                          onClick={handleExportMarkdown}
                          className="hidden lg:flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-medium text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-200"
                        >
                          <Download size={13} />
                          <span>Export</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-300">
                          <SlidersHorizontal size={13} />
                        </button>
                        <button
                          onClick={() => handleSend()}
                          disabled={!input.trim() && files.length === 0}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-black transition hover:bg-zinc-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowUp size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <div className="mx-auto w-full max-w-3xl">{renderSectionContent()}</div>
            </div>
          )}
        </main>

        {/* ── RIGHT PANEL ── */}
        <aside className="hidden h-full w-[300px] shrink-0 flex-col border-l border-[#1a1a1a] bg-[#0d0d0d] px-4 py-5 xl:flex overflow-y-auto">
          <div className="mb-5 flex items-center gap-2">
            <Star size={13} className="text-zinc-400" />
            <h3 className="text-sm font-bold text-white">Research Context</h3>
          </div>
          <p className="mb-5 text-xs leading-5 text-zinc-500">Files, citations, knowledge gaps, and session insights.</p>

          <div className="space-y-3">

            {/* Active Files */}
            <div className="rounded-xl border border-[#1e1e1e] bg-[#111] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">ACTIVE FILES</span>
                  {files.length > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-zinc-300">{files.length}</span>
                  )}
                </div>
              </div>
              <div className="px-4 py-3 space-y-2">
                {files.length > 0 ? (
                  files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 rounded-lg border border-[#1e1e1e] bg-[#0d0d0d] px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-white">{f.name}</p>
                        <p className="text-[10px] text-zinc-500">{f.type || "text/plain"}</p>
                      </div>
                      <button className="shrink-0 text-zinc-600 hover:text-zinc-400"><MoreVertical size={13} /></button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500">No active files</p>
                )}
              </div>
            </div>

            {/* Knowledge Gaps */}
            <div className="rounded-xl border border-[#1e1e1e] bg-[#111] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">KNOWLEDGE GAPS</span>
                  {knowledgeGaps.length > 0 && knowledgeGaps[0] !== "Add notes to surface missing topics and open questions." && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-zinc-300">{knowledgeGaps.length}</span>
                  )}
                </div>
                <button
                  onClick={() => submitSuggestion("Analyze my notes and uploaded files to list the biggest knowledge gaps")}
                  className="text-[10px] font-medium text-zinc-400 transition hover:text-white"
                >
                  Analyze
                </button>
              </div>
              <div className="px-4 py-3">
                {knowledgeGaps.length > 0 ? (
                  <div className="space-y-2">
                    {knowledgeGaps.map((gap, i) => (
                      <div key={i} className="flex items-start justify-between gap-2">
                        <p className="text-xs leading-5 text-zinc-400 flex-1">{gap}</p>
                        <ChevronRight size={12} className="mt-1 shrink-0 text-zinc-600" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">Add notes to surface missing topics and open questions.</p>
                )}
              </div>
            </div>

            {/* Citation List */}
            <div className="rounded-xl border border-[#1e1e1e] bg-[#111] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">CITATION LIST</span>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-zinc-300">{citations.length}</span>
                </div>
                <ChevronRight size={13} className="text-zinc-600" />
              </div>
              <div className="px-4 py-3">
                {citations.length > 0 ? (
                  <div className="space-y-2">
                    {citations.slice(0, 3).map((citation) => (
                      <div key={citation.id} className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-white">{citation.title}</p>
                          <p className="truncate text-[10px] text-zinc-500">{citation.date ? `Date ${citation.date}` : citation.url || "Citation"}</p>
                        </div>
                        <MoreVertical size={12} className="shrink-0 text-zinc-600" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">No citations generated yet.</p>
                )}
              </div>
            </div>

            {/* Deep Research Mode */}
            <div className="rounded-xl border border-[#1e1e1e] bg-[#111] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">DEEP RESEARCH MODE</span>
                <button onClick={() => setDeepResearchOpen((p) => !p)}>
                  <ChevronDown size={13} className={`text-zinc-500 transition-transform ${deepResearchOpen ? "rotate-180" : ""}`} />
                </button>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <span className={`h-2 w-2 rounded-full ${deepResearch ? "bg-white shadow-[0_0_6px_#ffffff80]" : "bg-zinc-600"}`} />
                  <span className="text-xs font-medium text-white">{deepResearch ? "Deep Research Mode" : "Standard Research Mode"}</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">{deepResearch ? "Fast, balanced AI responses." : "Fast, balanced AI responses."}</p>
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-xl border border-[#1e1e1e] bg-[#111] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">NOTES</span>
                  {notes.length > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-zinc-300">{notes.length}</span>
                  )}
                </div>
              </div>
              <div className="px-4 py-3 space-y-2">
                {notes.length > 0 ? (
                  notes.slice(0, 3).map((note) => (
                    <div key={note.id} className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white">{note.title}</p>
                        <p className="text-[10px] text-zinc-500">Updated {formatDate(note.updatedAt)}</p>
                      </div>
                      <MoreVertical size={12} className="shrink-0 text-zinc-600" />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500">No saved notes yet.</p>
                )}
              </div>
            </div>

            {/* Session Info */}
            <div className="rounded-xl border border-[#1e1e1e] bg-[#111] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1e1e1e]">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">SESSION INFO</span>
              </div>
              <div className="px-4 py-3 space-y-2.5">
                {[
                  { label: "User", value: session?.user?.email || "Guest" },
                  { label: "Started", value: sessionStartedAt ? formatDateLong(sessionStartedAt) : formatDateLong(new Date().toISOString()) },
                  { label: "Mode", value: deepResearch ? "Deep Research" : "Standard Research" },
                  { label: "Model", value: selectedModel },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-500">{label}</span>
                    <span className="text-[11px] text-zinc-300 truncate max-w-[160px] text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </aside>
      </div>
    </div>
  );
}