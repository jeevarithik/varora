function truncateText(value, maxLength = 2000) {
  if (!value) return "";
  return value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;
}

// Web search using available APIs
async function performWebSearch(query, maxResults = 3) {
  try {
    // Try Tavily API first (best for LLM context)
    if (process.env.TAVILY_API_KEY) {
      try {
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query: query,
            max_results: maxResults,
            include_answer: true,
          }),
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            console.log(`[SEARCH_TAVILY] Found ${data.results.length} results`);
            return {
              answer: data.answer || "",
              results: data.results.map(r => ({
                title: r.title,
                url: r.url,
                content: r.content,
              })),
            };
          }
        }
      } catch (err) {
        console.log("[SEARCH_TAVILY] Error:", err.message);
      }
    }
    
    // Note: DuckDuckGo API is unreliable, so we skip it
    // If user wants web search, they should configure TAVILY_API_KEY
    console.log("[SEARCH] No web search API configured. Using AI knowledge for comprehensive answer.");
    return { answer: "", results: [] };
  } catch (error) {
    console.log("[WEB_SEARCH] Error:", error.message);
    return { answer: "", results: [] };
  }
}

// Improved text-based similarity scoring with better matching logic
function calculateTextSimilarity(query, chunk) {
  if (!query || !chunk) return 0;
  
  const stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'if', 'as',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
    'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'some',
    'such', 'no', 'nor', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 
    'just', 'should', 'now', 'explain', 'tell', 'discuss', 'describe'
  ]);
  
  const queryWords = query.toLowerCase().split(/\W+/)
    .filter(w => w.length > 2 && !stopwords.has(w));
  const chunkText = chunk.toLowerCase();
  
  if (queryWords.length === 0) {
    // If all words are stopwords, do basic keyword matching on the original query
    return chunk.toLowerCase().includes(query.toLowerCase().substring(0, 10)) ? 0.3 : 0;
  }
  
  // Score based on word matches with higher weighting
  let exactMatches = 0;
  let partialMatches = 0;
  
  for (const word of queryWords) {
    if (chunkText.includes(word)) {
      exactMatches += 2; // Double weight for exact matches
    } else if (word.length > 4) {
      // Check for partial matches for longer words
      const substrings = word.match(/.{4,}/g) || [];
      if (substrings.some(sub => chunkText.includes(sub))) {
        partialMatches += 1;
      }
    }
  }
  
  // More generous scoring - each matched word counts
  const totalPossible = queryWords.length * 2;
  const score = (exactMatches + partialMatches) / totalPossible;
  return Math.min(score, 1);
}

async function buildRagContext(message, fileChunks) {
  if (!Array.isArray(fileChunks) || fileChunks.length === 0) {
    return { sourceText: "", sources: [], debug: { selectedCount: 0, totalChunks: 0, scores: [] } };
  }

  const chunks = fileChunks.slice(0, 64).filter(Boolean);
  if (chunks.length === 0) {
    return { sourceText: "", sources: [], debug: { selectedCount: 0, totalChunks: 0, scores: [] } };
  }

  // Score chunks based on improved text similarity to the message
  const scoredChunks = chunks
    .map((chunk, index) => ({
      index,
      score: calculateTextSimilarity(message, chunk),
      text: chunk,
    }))
    .sort((a, b) => b.score - a.score);

  // Log for debugging
  const debugScores = scoredChunks.slice(0, 10).map(c => ({ index: c.index, score: c.score.toFixed(3) }));
  console.log(`[RAG] Query: "${message.substring(0, 60)}..."`);
  console.log(`[RAG] Top 10 chunk scores:`, debugScores);

  // Lower threshold (10%) but keep higher count to ensure coverage
  const selectedChunks = scoredChunks
    .slice(0, 8)
    .filter((item) => item.score > 0.1);

  console.log(`[RAG] Selected ${selectedChunks.length} chunks with score > 0.1`);

  const sources = selectedChunks.map((chunk) => chunk.text.trim()).filter(Boolean);
  
  if (sources.length === 0) {
    // If no chunks meet threshold, take top 4 regardless of score
    console.log(`[RAG] No chunks met threshold, using top 4 chunks anyway`);
    const fallbackChunks = scoredChunks.slice(0, 4);
    const fallbackSources = fallbackChunks.map(c => c.text.trim()).filter(Boolean);
    
    return { 
      sourceText: fallbackSources.length > 0 ? fallbackSources
        .map((chunk, index) => `Source ${index + 1}:
${truncateText(chunk, 1200)}`)
        .join("\n\n") : "", 
      sources: fallbackSources,
      debug: { selectedCount: fallbackSources.length, totalChunks: chunks.length, scores: debugScores, threshold: 0.1, usedFallback: true }
    };
  }

  const sourceText = sources
    .map((chunk, index) => `Source ${index + 1}:
${truncateText(chunk, 1200)}`)
    .join("\n\n");

  return { sourceText, sources, debug: { selectedCount: sources.length, totalChunks: chunks.length, scores: debugScores, threshold: 0.1 } };
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

    // Always perform web search for comprehensive answers
    console.log(`[SEARCH] Initiating web search for: "${message.substring(0, 60)}..."`);
    const webSearchResults = await performWebSearch(message, deepResearch ? 5 : 3);
    console.log(`[SEARCH] Found ${webSearchResults.results.length} web results`);

    let sourceContext = "";
    let hasSources = false;
    let sourceCount = 0;
    
    // Combine file sources + web results
    const allSources = [];
    
    // Add file-based sources first (higher priority)
    if (Array.isArray(fileChunks) && fileChunks.length > 0) {
      const rag = await buildRagContext(message || "", fileChunks);
      if (rag.sources.length > 0) {
        rag.sources.forEach((source, idx) => {
          sourceCount++;
          allSources.push(`Source ${sourceCount}:\n${source}`);
        });
        hasSources = true;
      } else if (fileText) {
        sourceCount++;
        allSources.push(`Source ${sourceCount}:\n${truncateText(fileText, 1500)}`);
        hasSources = true;
      }
    } else if (fileText) {
      sourceCount++;
      allSources.push(`Source ${sourceCount}:\n${truncateText(fileText, 1500)}`);
      hasSources = true;
    }
    
    // Add web search results (supplementary sources)
    if (webSearchResults.results && webSearchResults.results.length > 0) {
      console.log(`[SEARCH] Adding ${webSearchResults.results.length} web sources`);
      webSearchResults.results.forEach((result, idx) => {
        sourceCount++;
        allSources.push(
          `Source ${sourceCount} (Web):\nTitle: ${result.title}\nContent: ${truncateText(result.content, 800)}\nURL: ${result.url}`
        );
      });
      hasSources = true;
    }
    
    if (allSources.length > 0) {
      sourceContext = `AVAILABLE INFORMATION:\n${allSources.join("\n\n")}\n\n`;
    }
    
    // Choose system prompt based on available sources
    let systemPrompt;
    
    if (hasSources) {
      // Comprehensive mode: use all available sources
      systemPrompt = `
You are Varora AI, an advanced research and knowledge assistant powered by comprehensive information synthesis.

Your guidelines:
1. **Answer all questions comprehensively** - combine uploaded documents, web data, and your knowledge
2. **Provide well-structured responses** - use headings, bullet points, and clear formatting
3. **Cite sources appropriately** - reference [Source X] when using specific information
4. **Be thorough** - provide multiple perspectives and detailed explanations
5. **Synthesize information** - combine information from multiple sources for better context
6. **Always provide an answer** - use all available sources to give the most complete response possible
7. **Format clearly** - make answers easy to read with good structure
8. **Deep Research Mode** - when enabled, provide even more thorough analysis with multiple angles

Your job is to synthesize all available information to provide the most helpful, accurate, and comprehensive answer possible.
`;
    } else {
      // General knowledge mode
      systemPrompt = `
You are Varora AI, a helpful and knowledgeable research assistant.

Your guidelines:
1. **Answer comprehensively** - provide thorough, detailed responses to all questions
2. **Be accurate** - use your knowledge to provide correct information
3. **Provide good structure** - use headings, bullet points, and clear formatting
4. **Include examples** - illustrate points with relevant examples
5. **Be helpful** - focus on providing the most useful information
6. **Deep Research Mode** - when enabled, provide more comprehensive analysis

Answer questions thoroughly, clearly, and helpfully.
`;
    }

    const userPrompt = `${sourceContext}Question: ${message || "(no message provided)"}

${deepResearch ? "Research Mode: DEEP - Provide thorough, multi-perspective analysis using all available sources" : ""}

Please provide a comprehensive, well-structured answer using all available information above. Be thorough and include relevant details from the sources.`;


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
        max_tokens: deepResearch ? 2500 : 1600,
      }),
    });

    console.log(`[GROQ] Response status: ${groqRes.status}`);

    let data;
    try {
      const responseText = await groqRes.text();
      console.log(`[GROQ] Response preview: ${responseText.substring(0, 200)}`);
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("[GROQ] Parse error:", parseError.message);
      console.error("[GROQ] Response status was:", groqRes.status);
      return Response.json(
        { error: "Failed to parse Groq API response", status: groqRes.status },
        { status: 500 }
      );
    }

    if (!groqRes.ok) {
      console.error("[GROQ] API returned error:", data);
      return Response.json(
        { error: data.error?.message || "Groq API failed", status: groqRes.status },
        { status: groqRes.status }
      );
    }

    const reply = data.choices?.[0]?.message?.content;
    
    if (!reply) {
      console.error("[GROQ] No reply content in response:", JSON.stringify(data).substring(0, 300));
      return Response.json(
        { error: "No response content from AI model" },
        { status: 500 }
      );
    }

    console.log(`[GROQ] Successfully got reply (${reply.length} chars)`);

    return Response.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("[CHAT] Catch block error:", error.message);
    console.error("[CHAT] Error stack:", error.stack?.substring(0, 300));

    return Response.json(
      { error: "Internal server error in chat route", message: error.message },
      { status: 500 }
    );
  }
}
