import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided." });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Note: If you get "Model Not Found", use "gemini-1.5-flash" as it's more stable for free keys
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      systemInstruction: "You are a senior clinical auditor who writes with gritty, analytical density. You avoid all standard AI transitions like 'Furthermore' or 'In conclusion.' Your goal is to rewrite text to be indistinguishable from a human expert while maintaining every citation and score."
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `DECONSTRUCT AND RE-ENGINEER (Target 0% Detection):
          
          1. NO SUMMARIES: The output must be the same length as the input (~280 words).
          2. LINGUISTIC FRICTION: Replace polite terms with hard, technical clinical phrasing.
          3. BURSTINESS: Use complex sentence structures and em-dashes (—).
          4. CITATION PROTECTION: Keep every citation (e.g., Roehrich et al., 2014).
          
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.15, // Lowered slightly from 1.42 for better stability on free tier
        topP: 0.95,
        maxOutputTokens: 3000, 
      }
    });

    const response = await result.response;
    return res.status(200).json({ output: response.text().trim() });
    
  } catch (error) {
    // We log the real error to your Vercel logs, but send a clean error to the user
    console.error("API Error:", error.message);
    
    return res.status(500).json({ 
      error: "Humanizer X Pro is recalibrating due to high demand. Please try again in a moment." 
    });
  }
}
