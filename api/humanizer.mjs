import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Vercel Configuration (Required in 2026 for long AI calls)
export const config = {
  maxDuration: 60, // Extends the function limit to 60 seconds (Hobby limit)
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided." });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: `You are an expert editor. 
      STRICT: Match input length (+/- 10%). Do not truncate.
      
      HUMANIZATION:
      - Start some sentences with 'And', 'But', or 'So'.
      - Use human rhythms: a very long sentence followed by a 4-word sentence.
      - Use gritty synonyms (e.g., 'bottleneck' instead of 'problem').
      - Break the AI flow with em-dashes (—).`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: `Rewrite this to be human-like but keep the exact length: "${text}"` }]
      }],
      generationConfig: {
        temperature: 1.28, // Dropped from 1.35 to speed up the engine
        topP: 0.90,        // Focused range to prevent "infinite thinking" loops
        maxOutputTokens: 3000, 
      }
    });

    const response = await result.response;
    let output = response.text().trim();
    output = output.replace(/^(Option \d+|Output|Result|Rewrite):/gi, "");

    return res.status(200).json({ output: output });

  } catch (error) {
    console.error("Fetch Error Detail:", error.message);
    // If it's a timeout, give the user a clear message
    return res.status(500).json({ error: "The AI took too long to think. Please try a shorter text or try again." });
  }
}
