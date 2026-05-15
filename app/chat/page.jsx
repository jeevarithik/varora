"use client";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiCopy } from "react-icons/fi";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import {
  FiArrowUp,
  FiBookOpen,
  FiClock,
  FiDownload,
  FiEdit3,
  FiFileText,
  FiPlus,
  FiSettings,
  FiUpload,
  FiX,
} from "react-icons/fi";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [history, setHistory] = useState([]);
  const [savedFiles, setSavedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "ai",
      content: `# VARORA AI

Minimal AI workspace for:
- Research
- Summarization
- Deep analysis
- Intelligent insights

Upload a file or ask anything to begin.`,
    },
  ]);

  const uploadedFileRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const savedFile = localStorage.getItem("varora-uploaded-file");
    const savedHistory = localStorage.getItem("varora-history");

    if (savedFile) {
      const file = JSON.parse(savedFile);
      setUploadedFile(file);
      uploadedFileRef.current = file;
    }

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    const savedChat = localStorage.getItem(
  "varora-current-chat"
);


if (savedChat) {
  setMessages(JSON.parse(savedChat));
}
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);
  useEffect(() => {
  localStorage.setItem(
    "varora-current-chat",
    JSON.stringify(messages)
  );
}, [messages]);
useEffect(() => {
  if (status === "loading") return;

  if (!session) {
    router.push("/login");
  }
}, [session, status, router]);
useEffect(() => {
  const fetchHistory = async () => {
    if (!session?.user?.id) return;

    try {
      const res = await fetch("/api/chat/history", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          userId: session.user.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const formattedHistory = data.chats.map((chat) => ({
          id: chat._id,
          title: chat.title,
          messages: chat.messages,
        }));

        setHistory(formattedHistory);
      }
    } catch (error) {
      console.error(error);
    }
  };

  fetchHistory();
}, [session]);
useEffect(() => {
  const fetchFiles = async () => {
    if (!session?.user?.id) return;

    try {
      const res = await fetch("/api/file/history", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          userId: session.user.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSavedFiles(data.files);
      }
    } catch (error) {
      console.error(error);
    }
  };

  fetchFiles();
}, [session]);

  const saveHistory = (updatedMessages) => {
    const userFirstMessage = updatedMessages.find((m) => m.role === "user");
    if (!userFirstMessage) return;

    const newItem = {
      id: Date.now(),
      title: userFirstMessage.content.slice(0, 35),
      messages: updatedMessages,
    };

    const updatedHistory = [newItem, ...history].slice(0, 8);
    setHistory(updatedHistory);
    localStorage.setItem("varora-history", JSON.stringify(updatedHistory));

    if (session?.user?.id) {
      fetch("/api/chat/save", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          userId: session.user.id,
          title: userFirstMessage.content.slice(0, 35),
          messages: updatedMessages,
        }),
      });
    }
  };

  const startNewResearch = () => {
    saveHistory(messages);
    setMessages([
      {
        role: "ai",
        content:
          "Welcome to Varora AI. Upload a file or ask anything to begin research.",
      },
    ]);
    setMessage("");
    setUploadedFile(null);
    uploadedFileRef.current = null;
    localStorage.removeItem("varora-uploaded-file");
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    uploadedFileRef.current = null;
    localStorage.removeItem("varora-uploaded-file");
  };
  const saveCurrentNote = () => {
  const note = {
    id: Date.now(),
    title: messages.find((m) => m.role === "user")?.content?.slice(0, 40) || "Untitled Research Note",
    content: messages
      .map((msg) => `${msg.role === "user" ? "You" : "Varora AI"}:\n${msg.content}`)
      .join("\n\n"),
  };

  const oldNotes = JSON.parse(localStorage.getItem("varora-notes") || "[]");
  const updatedNotes = [note, ...oldNotes];

  localStorage.setItem("varora-notes", JSON.stringify(updatedNotes));

  alert("Note saved successfully!");
};
  const handleFileUpload = async (e) => {
   const files = Array.from(e.target.files || []);
if (files.length === 0) return;

    try {
      let combinedText = "";
let fileNames = [];

for (const file of files) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  combinedText += `\n\n===== ${file.name} =====\n\n`;
  combinedText += data.text || "";

  fileNames.push(file.name);
}

const processedFile = {
  name: `${files.length} files uploaded`,
  text: combinedText,
  files: fileNames,
};
      const readStreamingResponse = async (res, onToken) => {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);

    chunk.split("\n").forEach((line) => {
      if (!line.startsWith("data: ")) return;

      const data = line.replace("data: ", "").trim();
      if (data === "[DONE]") return;

      try {
        const parsed = JSON.parse(data);
        const token = parsed.choices?.[0]?.delta?.content || "";
        onToken(token);
      } catch {}
    });
  }
};

      setUploadedFile(processedFile);
      uploadedFileRef.current = processedFile;
      if (session?.user?.id) {
  fetch("/api/file/save", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      userId: session.user.id,
      name: processedFile.name,
      content: processedFile.text,
      type: "document",
    }),
  });
}

      localStorage.setItem(
        "varora-uploaded-file",
        JSON.stringify(processedFile)
      );

      setMessages((prev) => [
  ...prev,
  {
    role: "ai",
    content: `Successfully uploaded and processed ${processedFile.name}`,
  },
]);

setLoading(true);

try {
  const summaryPrompt = `
Summarize this uploaded file clearly.

Include:
- Main topic
- Important points
- Key insights
- Simple explanation
- Final conclusion
`;

  const res = await fetch("/api/chat", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      message: summaryPrompt,
      fileText: processedFile.text,
    }),
  });
let aiText = "";

await readStreamingResponse(res, (token) => {
  aiText += token;

  setMessages((prev) => {
    const copy = [...prev];

    copy[copy.length - 1] = {
      role: "ai",
      content: aiText,
    };

    return copy;
  });
});
} catch (error) {
  console.error(error);
}

setLoading(false);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "File upload failed. Please upload a readable file.",
        },
      ]);
    } finally {
      e.target.value = "";
    }
  };
const readStreamingResponse = async (res, onToken) => {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    const chunk = decoder.decode(value);

    chunk.split("\n").forEach((line) => {
      if (!line.startsWith("data: ")) return;

      const data = line.replace("data: ", "").trim();

      if (data === "[DONE]") return;

      try {
        const parsed = JSON.parse(data);

        const token =
          parsed.choices?.[0]?.delta?.content || "";

        onToken(token);
      } catch {}
    });
  }
};
const clearChat = () => {
  const freshChat = [
    {
      role: "ai",
      content: `# VARORA AI

Minimal AI workspace for:
- Research
- Summarization
- Deep analysis
- Intelligent insights

Upload a file or ask anything to begin.`,
    },
  ];

  setMessages(freshChat);
  setMessage("");

  localStorage.setItem(
    "varora-current-chat",
    JSON.stringify(freshChat)
  );
};

const sendMessage = async () => {

  if (!message.trim() || loading) return;

  const userMessage = message;
  setMessage("");
  setLoading(true);

  const updatedMessages = [
    ...messages,
    { role: "user", content: userMessage },
    { role: "ai", content: "" },
  ];

  setMessages(updatedMessages);

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

    
    let aiText = "";

setMessages((prev) => [
  ...prev,
  {
    role: "ai",
    content: "",
  },
]);

await readStreamingResponse(res, (token) => {
  aiText += token;

  setMessages((prev) => {
    const copy = [...prev];

    copy[copy.length - 1] = {
      role: "ai",
      content: aiText,
    };

    return copy;
  });
});

    saveHistory([
      ...messages,
      { role: "user", content: userMessage },
      { role: "ai", content: aiText },
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

const deleteHistoryItem = (id) => {
  const updated = history.filter((item) => item.id !== id);

  setHistory(updated);

  localStorage.setItem(
    "varora-history",
    JSON.stringify(updated)
  );
};
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-white/10 blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-white/10 blur-[140px]" />
      </div>

      <div className="relative z-10 flex h-screen gap-8 p-7">
        <aside className="hidden w-[360px] shrink-0 flex-col justify-between rounded-[30px] border border-white/10 bg-white/[0.03] p-10 backdrop-blur-[35px] lg:flex">
          <div>
            <h1 className="text-[36px] font-semibold tracking-[0.12em]">
              VARORA.AI
            </h1>

            <button
              type="button"
              onClick={startNewResearch}
              className="mt-16 flex h-[96px] w-full items-center gap-7 rounded-2xl border border-white/10 bg-white/5 px-8 text-lg font-semibold transition hover:bg-white/10"
            >
              <FiPlus size={24} />
              New Research
            </button>

            <nav className="mt-10 space-y-7">
              {[
                [FiClock, "Recent Research"],
                [FiFileText, "Uploaded Files"],
                [FiEdit3, "Saved Notes"],
                [FiBookOpen, "Citations"],
                [FiSettings, "Settings"],
              ].map(([Icon, label], index) => (
                <button
                  onClick={() => {
  if (label === "Saved Notes") {
    saveCurrentNote();
  }

  if (label === "Citations") {
    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        content: uploadedFile
          ? `## Citation

**Source Used:** ${uploadedFile.name}

**Type:** Uploaded file content

**Note:** Response is based on the uploaded document.`
          : "No uploaded file found. Upload a file first to generate citation details.",
      },
    ]);
  }

  if (label === "Uploaded Files") {
  setMessages((prev) => [
    ...prev,
    {
      role: "ai",
      content:
        savedFiles.length > 0
          ? `## Saved Uploaded Files

${savedFiles
  .map((file, index) => `${index + 1}. ${file.name}`)
  .join("\n")}`
          : "No saved uploaded files found.",
    },
  ]);
}

if (label === "Recent Research") {
  if (history.length === 0) {
    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        content: "No recent research history found.",
      },
    ]);
  } else {
    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        content: `## Recent Research

${history
  .map(
    (item, index) =>
      `${index + 1}. ${item.title}`
  )
  .join("\n")}`,
      },
    ]);
  }
}
if (label === "Settings") {
  setMessages((prev) => [
    ...prev,
    {
      role: "ai",
      content: `## Workspace Settings

- Theme: Minimal Black & White
- AI Model: Llama 3.3 70B
- Streaming: Enabled
- File Support:
  - PDF
  - DOCX
  - PPTX
  - TXT
- Export: Enabled
- Research History: Enabled`,
    },
  ]);
}
}}
                  key={label}
                  className={`flex h-[96px] w-full items-center gap-7 rounded-2xl border px-8 text-left text-lg transition hover:bg-white/10 ${
                    index === 0
                      ? "border-white/20 bg-white/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-white/70"
                  }`}
                >
                  <Icon size={22} />
                  {label}
                </button>
              ))}
            </nav>

            <div className="mt-10">
              <p className="text-sm text-white/45">History</p>

              {history.length === 0 ? (
                <p className="mt-3 text-sm text-white/35">
                  No saved research yet
                </p>
              ) : (
                <div className="custom-scroll mt-3 max-h-[180px] space-y-3 overflow-y-auto pr-2">
                  {history.map((item) => (
                    <div
  key={item.id}
  className="flex items-center gap-2"
>
  <button
    type="button"
    onClick={() => {
      setMessages(item.messages);

      localStorage.setItem(
        "varora-current-chat",
        JSON.stringify(item.messages)
      );
    }}
    className="flex-1 truncate rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-white/70 hover:bg-white/10"
  >
    {item.title}
  </button>

  <button
    type="button"
    onClick={() => deleteHistoryItem(item.id)}
    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/10 hover:text-white"
  >
    <FiX size={14} />
  </button>
</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-7">
            <p className="text-lg font-semibold">PRO PLAN</p>
<button
  type="button"
  onClick={() => signOut()}
  className="mt-4 h-[54px] w-full rounded-2xl border border-red-500/20 bg-red-500/10 font-semibold text-red-300 transition hover:bg-red-500/20"
>
  Logout
</button>
            <div className="mt-5 space-y-3 text-sm text-white/70">
              <p>✓ Unlimited research</p>
              <p>✓ Unlimited uploads</p>
              <p>✓ Advanced AI models</p>
            </div>

            <button
              type="button"
              className="mt-7 h-[54px] w-full rounded-2xl border border-white/10 bg-white/5 font-semibold hover:bg-white/10"
            >
              Upgrade Now
            </button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[92px] items-center justify-between">
  <div>
    <h2 className="text-[38px] font-bold tracking-[-0.04em]">
      Research Workspace
    </h2>

    <p className="mt-2 text-lg text-white/60">
      Ask, upload, analyze, and generate research insights
    </p>
  </div>

  <div className="flex items-center gap-4">
    <button
      type="button"
      onClick={() => {
        const markdown = messages
          .map(
            (msg) =>
              `## ${msg.role === "user" ? "You" : "Varora AI"}\n\n${msg.content}`
          )
          .join("\n\n---\n\n");

        const blob = new Blob([markdown], {
          type: "text/markdown",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = "varora-research.md";
        a.click();

        URL.revokeObjectURL(url);
      }}
      className="flex h-[56px] items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-7 hover:bg-white/10"
    >
      <FiDownload />
      Export
    </button>

    <button
      type="button"
      onClick={clearChat}
      className="flex h-[56px] items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-7 hover:bg-white/10"
    >
      Clear Chat
    </button>
  </div>
</header>
          <div
  className="min-h-0 flex-1 overflow-hidden relative"
  onDragOver={(e) => {
    e.preventDefault();
    setDragActive(true);
  }}
  onDragLeave={() => {
    setDragActive(false);
  }}
  onDrop={async (e) => {
    e.preventDefault();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files || []);

    if (droppedFiles.length === 0) return;

    const fakeEvent = {
      target: {
        files: droppedFiles,
        value: "",
      },
    };

    await handleFileUpload(fakeEvent);
  }}
>{dragActive && (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
    <div className="rounded-[32px] border border-white/10 bg-white/[0.05] px-16 py-14 text-center shadow-[0_0_80px_rgba(255,255,255,0.08)]">
      <p className="text-3xl font-semibold text-white">
        Drop files to upload
      </p>

      <p className="mt-3 text-white/60">
        PDF, DOCX, PPTX, TXT supported
      </p>
    </div>
  </div>
)}
            <div className="flex h-full flex-col">
              <div className="custom-scroll min-h-0 flex-1 space-y-7 overflow-y-auto px-6 py-8">
                {messages.map((item, index) => (
                  <div
                    key={index}
                    className={`flex w-full ${
                      item.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                     className={`max-w-[78%] rounded-[28px] border border-white/10 px-7 py-6 backdrop-blur-[35px] transition-all duration-300 ${
  item.role === "user"
    ? "bg-white/[0.08] text-right"
    : "bg-white/[0.04] text-left shadow-[0_0_35px_rgba(255,255,255,0.04)]"
}`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-4">
  <p
    className={`text-lg font-semibold ${
      item.role === "ai"
        ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.35)]"
        : "text-white"
    }`}
  >
    {item.role === "user" ? "You" : "✦ Varora AI"}
  </p>

  {item.role === "ai" && (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(item.content);
      }}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/60 transition hover:bg-white/10 hover:text-white"
    >
      <FiCopy size={15} />
    </button>
  )}
</div>
                     <div className="prose prose-invert max-w-none text-[17px] leading-8 text-white/80">
 <ReactMarkdown>{item.content}</ReactMarkdown>
</div>
                    </motion.div>
                  </div>
                ))}

               {loading && (
  <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] px-7 py-5 text-white/70 backdrop-blur-[35px]">
    <div className="flex gap-1">
      <motion.div
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{
          duration: 1,
          repeat: Infinity,
          delay: 0,
        }}
        className="h-2 w-2 rounded-full bg-white"
      />

      <motion.div
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{
          duration: 1,
          repeat: Infinity,
          delay: 0.2,
        }}
        className="h-2 w-2 rounded-full bg-white"
      />

      <motion.div
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{
          duration: 1,
          repeat: Infinity,
          delay: 0.4,
        }}
        className="h-2 w-2 rounded-full bg-white"
      />
    </div>

    <span>Varora AI is thinking...</span>
  </div>
)}

                <div ref={messagesEndRef} />
              </div>

              {uploadedFile && (
                <div className="px-6 pb-4">
                  <div className="flex max-w-full flex-wrap items-center gap-3">
                    {uploadedFile.files ? (
  uploadedFile.files.map((fileName, index) => (
    <div
      key={index}
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white"
    >
      <FiFileText />

      <span className="max-w-[220px] truncate">
        {fileName}
      </span>
    </div>
  ))
) : (
  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white">
    <FiFileText />

    <span className="max-w-[220px] truncate">
      {uploadedFile.name}
    </span>
  </div>
)}

<button
                      type="button"
                      onClick={removeUploadedFile}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                    >
                      <FiX size={15} />
                    </button>
                  </div>
                </div>
              )}

              <div className="px-6 pb-4">
                <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.06] backdrop-blur-[35px] transition-all duration-300">
                  <textarea
                    rows={1}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask Varora AI anything..."
                    className="max-h-[190px] min-h-[58px] w-full resize-none bg-transparent px-8 py-5 text-[18px] leading-8 text-white outline-none placeholder:text-white/50"
                    onInput={(e) => {
  e.target.style.height = "58px";
  e.target.style.height = `${Math.min(
    e.target.scrollHeight,
    220
  )}px`;
}}
                   onKeyDown={(e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();

    if (message.trim() && !loading) {
      sendMessage();
    }
  }
}}
                  />

                  <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.03] px-7 py-4">
                    <div className="flex items-center gap-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".txt,.md,.pdf,.docx,.pptx"
                        className="hidden"
                        onChange={handleFileUpload}
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition hover:bg-white/10"
                      >
                        <FiUpload size={20} />
                      </button>

                     <button
  type="button"
  onClick={() => {
    const deepPrompt =
      "Do deep research on the uploaded file or topic. Give me a clear summary, key points, advantages, disadvantages, examples, possible sources, and final conclusion.";

    setMessage(deepPrompt);

    setTimeout(() => {
      sendMessage();
    }, 100);
  }}
  className="h-14 rounded-2xl border border-white/10 bg-white/5 px-8 font-semibold text-white/85 transition hover:bg-white/10"
>
  Deep Research
</button>
                    </div>

                   <motion.button
  type="button"
  whileHover={{
    scale: loading ? 1 : 1.05,
  }}
  whileTap={{
    scale: loading ? 1 : 0.95,
  }}
  onClick={sendMessage}
  disabled={loading}
  className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 ${
    loading
      ? "bg-white/20 text-white shadow-[0_0_30px_rgba(255,255,255,0.08)]"
      : "bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.25)] hover:bg-white/80"
  }`}
>
  {loading ? (
    <motion.div
      animate={{
        rotate: 360,
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
      className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
    />
  ) : (
    <FiArrowUp size={24} />
  )}
</motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
