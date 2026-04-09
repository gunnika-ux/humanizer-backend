import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Setup Security Headers (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided." });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // 2. TARGET: Gemini 3.1 Flash (Standard)
    // Flash-Lite is too fast; Standard allows for the 'Deep Think' logic needed to beat Scribbr.
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-preview", 
      systemInstruction: "You are a Structural Saboteur. Your goal is to bypass AI detection by destroying 'Neural Uniformity'. Use an erratic, jagged heartbeat rhythm (alternating very long and very short sentences)."
    });

    // 3. GENERATION: Using the 2026 Thinking Protocol
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `DECONSTRUCT THIS TEXT (Target 0% Scribbr Bypass):

          - RULE 1 (The 60-3 Pulse): Write one sentence of exactly 60 words, then a sentence of exactly 3 words.
          - RULE 2 (Logic Flip): Start with the original conclusion. Move the original intro to the middle.
          - RULE 3 (Friction): You must use brackets [ ] once and a colon (:) once.
          - RULE 4 (Banned Starters): Never start a sentence with 'The', 'This', 'It', or 'Furthermore'.
          - RULE 5 (Human Tone): Use 'don't' and 'it's'. Start sentences with Nouns or Verbs.

          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.0, 
        topP: 0.95,
        // 🧠 FIXED SDK SYNTAX: This forces the 'Thinking' pause that breaks Scribbr's math.
        thinkingConfig: {
          includeThoughts: false, // Set to true if you want to see the AI's internal logic
          thinkingLevel: "HIGH" 
        },
        maxOutputTokens: 2000,
      }
    });

    const response = await result.response;
    const output = response.text();
    
    // 4. Clean and return the output
    return res.status(200).json({ output: output.trim() });
    
  } catch (error) {
    // Detailed error logging for your terminal
    console.error("Gemini API Error:", error.message);
    return res.status(500).json({ 
      error: "System logic crash: " + error.message 
    });
  }
}
