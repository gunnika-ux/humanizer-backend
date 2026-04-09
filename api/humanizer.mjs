import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided." });

    // 1. Initialize with v1beta to enable "Thinking" features
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // 2. USE THE CORRECT 2026 MODEL ID
    // 'gemini-3-flash-preview' is the Standard version that supports High Thinking.
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", 
      systemInstruction: "You are a Structural Saboteur. Break all rhythmic patterns by alternating very long sentences with extremely short ones. Avoid common AI transitional phrases."
    }, { apiVersion: 'v1beta' });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `DECONSTRUCT THIS TEXT (Target 0% Scribbr):
          - RULE: Use one 60-word sentence followed by a 3-word punch.
          - RULE: Start with the original conclusion.
          - RULE: Use brackets [ ] and a colon (:) once.
          - RULE: Never start with 'The', 'This', 'It', or 'Furthermore'.
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.0,
        // 🧠 The 2026 'Thinking' block
        thinkingConfig: {
          includeThoughts: false,
          thinkingLevel: "HIGH" 
        },
        maxOutputTokens: 2000,
      }
    });

    const response = await result.response;
    const output = response.text();
    
    return res.status(200).json({ output: output.trim() });
    
  } catch (error) {
    console.error("Gemini Error:", error.message);
    
    // Fallback: If 'Standard' is still not found in your region, try the Lite version ID
    return res.status(500).json({ 
      error: "Bypass Error: Ensure your API key has 'Gemini 3 Flash' access." 
    });
  }
}
