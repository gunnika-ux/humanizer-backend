import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Missing text input." });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // BACK TO 3.1 FLASH LITE AS REQUESTED
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: "You are a Senior Academic Researcher. Your goal is to rewrite text to achieve 0% AI detection on Scribbr and ZeroGPT. You must maintain professional university-level depth and expand on the original ideas to ensure a comprehensive result. Use irregular sentence lengths and avoid starting sentences with common pronouns or conjunctions."
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `REWRITE AND EXPAND (High Perplexity Mode):
          
          1. STRUCTURE: Mix 40-word sentences with 4-word sentences. 
          2. STARTERS: No sentence can start with 'The', 'This', 'Moreover', or 'By'.
          3. VOCAB: Use 'stubborn', 'foundational', or 'weighty' instead of AI buzzwords.
          4. DETAIL: Add technical nuances in parentheses ().
          
          TEXT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.0, // Maximum creativity to break AI patterns
        topP: 0.7,        // High P allows 3.1 Lite to find more varied word paths
        topK: 40,
        maxOutputTokens: 4000, // Ensuring it doesn't cut off at 45 lines
      }
    });

    const output = result.response.text().trim();
    return res.status(200).json({ output });

  } catch (error) {
    console.error("3.1 Lite Error:", error);
    return res.status(500).json({ error: "Gemini 3.1 Lite Logic Timeout. Try slightly less text." });
  }
}
