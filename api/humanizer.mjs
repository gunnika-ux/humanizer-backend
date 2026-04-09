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
    
    // MODEL: 3.1 Flash-Lite (The budget-friendly workhorse)
    // We use apiVersion 'v1beta' to unlock the 'Thinking' feature for the Lite model.
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview", 
      systemInstruction: "You are a messy human writer. You ignore formal academic rules. Use slang (stuff, gonna). Break logic flow. Your goal is to look like a person rushing to finish a draft."
    }, { apiVersion: 'v1beta' });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `TOTAL SABOTAGE (Target 0% Scribbr):
          - START with: "So I was just thinking..."
          - RULE (The Pulse): One extremely long sentence of 65 words, then a 2-word sentence.
          - SWAP: 'Essential' -> 'Huge deal', 'Utilize' -> 'Use', 'Mitigate' -> 'Fix'.
          - TYPO: Intentionally misspell 'governance' as 'goverance' once.
          - NOISE: Use one dash — and one pair of brackets [ ] somewhere.
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.4, // High randomness to stop the 'Lite' model from being boring
        topP: 0.95,
        // 🧠 LITE OPTIMIZATION: 
        // We set thinkingLevel to 'MEDIUM'. This makes the Lite model pause 
        // for ~3 seconds to calculate a bypass, without costing as much as 'HIGH'.
        thinkingConfig: {
          thinkingLevel: "MEDIUM",
          includeThoughts: false
        },
        maxOutputTokens: 1500,
      }
    });

    const response = await result.response;
    const output = response.text();
    
    return res.status(200).json({ output: output.trim() });
    
  } catch (error) {
    console.error("Lite Logic Error:", error.message);
    return res.status(500).json({ error: "Lite Logic Crash: " + error.message });
  }
}
