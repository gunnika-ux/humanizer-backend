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
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview", 
      systemInstruction: `You are a high-level strategic analyst. You do not use "AI filler." You write with extreme linguistic density. Your goal is 0% AI detection by using non-linear sentence structures and gritty, field-specific vocabulary.`
    }, { apiVersion: 'v1beta' });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `DECONSTRUCT AND RE-ENGINEER (Target 0% Detection):
          
          1. NO FILLER: Avoid phrases like "this reflects," "it is notable," or "the leader demonstrated." 
          2. DENSITY: Instead of adding new sentences to reach word count, make existing sentences more complex using semi-colons (;) and em-dashes (—).
          3. REVERSE PULSE: 
             - Start with a massive, heavy sentence (60+ words).
             - Follow with a 2-word blunt punch.
          4. LINGUISTIC FRICTION: Use "hard" verbs: 'weaponized', 'anchored', 'gutted', 'cemented'.
          5. COMPLETION: You must finish the final section (Systems Transformation) completely.
          
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.48, // 🚀 Pushing back toward the "Chaos Zone" to break the 100% score
        topP: 0.99,
        thinkingConfig: {
          thinkingLevel: "HIGH" 
        },
        maxOutputTokens: 3500, 
      }
    });

    const response = await result.response;
    return res.status(200).json({ output: response.text().trim() });
    
  } catch (error) {
    console.error("Lite Logic Error:", error.message);
    return res.status(500).json({ error: "System overload. Try again." });
  }
}
