export async function POST(req) {
  try {
    const { message, fileText, deepResearch } = await req.json();

    if (!message && !fileText) {
      return Response.json(
        { error: "Message or file text is required" },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return Response.json(
        { error: "Missing GROQ_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const systemPrompt = `
You are Varora AI, a student research assistant.

Your job:
- Explain clearly
- Summarize notes
- Generate study-ready answers
- Create key points
- Help with citations when source text is available
- Use headings and bullet points
- Keep answers simple and useful

Rules:
- Do not say you cannot access files if fileText is provided.
- If source text is missing, say citation/source details are not available.
- If deepResearch is true, give a more detailed structured answer.
`;

    const userPrompt = `
User question:
${message || ""}

Deep research mode:
${deepResearch ? "ON" : "OFF"}

Uploaded file/source text:
${fileText || "No uploaded file text provided."}
`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.4,
        max_tokens: deepResearch ? 1800 : 900,
      }),
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      console.error("Groq API error:", data);
      return Response.json(
        { error: data.error?.message || "Groq API failed" },
        { status: groqRes.status }
      );
    }

    const reply =
      data.choices?.[0]?.message?.content ||
      "No AI response generated.";

    return Response.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("Chat route error:", error);

    return Response.json(
      { error: "Internal server error in chat route" },
      { status: 500 }
    );
  }
}
