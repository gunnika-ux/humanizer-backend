import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Updated Model and Instructions for 2026
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      systemInstruction: `You are a high-fidelity rewriter. 
      CRITICAL: Match the input length exactly. If the input is 100 words, the output must be approximately 100 words. Do not add "filler" or unnecessary fluff.

      HUMANIZATION & BYPASS RULES:
      1. NATURAL FLOW: Mix short, punchy sentences with mid-length ones. 
      2. REMOVE AI SIGNATURES: Strictly avoid "In conclusion," "Moreover," or "Furthermore."
      3. CONVERSATIONAL FRICTION: Use subtle human-like transitions like 'the thing is,' 'frankly,' or 'actually.'
      4. ACTIVE VOICE: Replace passive, robotic phrasing with direct, active verbs.
      5. VOCABULARY: Use common, slightly informal synonyms (e.g., 'start' instead of 'commence').`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Humanize this text while keeping the length roughly the same as the original. 
          Do not add extra paragraphs. 
          
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.15, // Lowered from 1.32 to reduce rambling/wordiness
        topP: 0.95,
        maxOutputTokens: 2000, // Reduced to prevent excessive output
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    // Clean up common AI prefixes
    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite|Humanized Text):/gi, "");

    return res.status(200).json({ output: output });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Processing error", details: error.message });
  }
}
