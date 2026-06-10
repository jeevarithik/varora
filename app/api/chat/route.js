function truncateText(value, maxLength = 2000) {
  if (!value) return "";
  return value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;
}

// Simple text-based similarity scoring
function calculateTextSimilarity(query, chunk) {
  if (!query || !chunk) return 0;
  
  const queryWords = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const chunkWords = chunk.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  
  if (queryWords.length === 0 || chunkWords.length === 0) return 0;
  
  const commonWords = queryWords.filter(word => 
    chunkWords.some(cw => cw.includes(word) || word.includes(cw))
  );
  
  return commonWords.length / Math.max(queryWords.length, chunkWords.length);
}

async function buildRagContext(message, fileChunks) {
  if (!Array.isArray(fileChunks) || fileChunks.length === 0) {
    return { sourceText: "", sources: [] };
  }

  const chunks = fileChunks.slice(0, 64).filter(Boolean);
  if (chunks.length === 0) {
    return { sourceText: "", sources: [] };
  }

  // Score chunks based on text similarity to the message
  const scoredChunks = chunks
    .map((chunk, index) => ({
      index,
      score: calculateTextSimilarity(message, chunk),
      text: chunk,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .filter((item) => item.score > 0.1); // Keep chunks with at least 10% similarity

  const sources = scoredChunks.map((chunk) => chunk.text.trim()).filter(Boolean);
  
  if (sources.length === 0) {
    return { sourceText: "", sources: [] };
  }

  const sourceText = sources
    .map((chunk, index) => `Source ${index + 1}:
${truncateText(chunk, 1200)}`)
    .join("\n\n");

  return { sourceText, sources };
}

export async function POST(req) {
  try {
    const { message, fileText, fileChunks, deepResearch } = await req.json();

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
You are Varora AI, a research assistant trained to use source material when available.

Your job:
- Answer questions clearly and directly
- Summarize notes and key information
- Generate bullet point key takeaways
- Provide citations from provided source excerpts (cite source numbers like [Source 1])
- Use headings, bullets, and short explanations for clarity
- Be concise and accurate

Instructions:
- ALWAYS answer the user's question directly
- If source material is provided below, prefer to cite and reference it
- If no relevant source material is available, still answer based on your knowledge
- Do not leave questions unanswered - provide the best answer you can
- For deep research mode: provide more structured analysis, examples, and deeper exploration
- Format responses with clear structure: use headings, bullet points, and numbered lists

Be helpful and thorough in your responses.
`;

    let sourceContext = "";
    if (Array.isArray(fileChunks) && fileChunks.length > 0) {
      const rag = await buildRagContext(message || "", fileChunks);
      if (rag.sources.length > 0) {
        sourceContext = `RELEVANT SOURCE MATERIAL:\n${rag.sourceText}\n\n`;
      } else {
        sourceContext = `NOTE: File was uploaded but no specific sources matched the query. You may still refer to general content if relevant.\n\n`;
      }
    } else if (fileText) {
      sourceContext = `UPLOADED DOCUMENT CONTENT:\n${truncateText(fileText, 2000)}\n\n`;
    }

    const userPrompt = `Question: ${message || "(no message provided)"}

Deep Research Mode: ${deepResearch ? "ON" : "OFF"}

${sourceContext}

Please answer the question directly and thoroughly. If source material is provided above, feel free to reference and cite it. Always provide a helpful response.`;

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

    const reply = data.choices?.[0]?.message?.content;
    
    if (!reply) {
      console.error("Groq response missing content:", data);
      return Response.json(
        { error: "No response content from AI model", debug: data },
        { status: 500 }
      );
    }

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
