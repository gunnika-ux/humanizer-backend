import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // SWITCH TO STANDARD FLASH (Supports High-Intensity Thinking)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-preview", 
      systemInstruction: "You are a Structural Saboteur. Your only task is to destroy 'Neural Uniformity'. You must write with an erratic, jagged rhythm that defies AI probability patterns. Avoid all polished transitions."
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `DECONSTRUCT THIS TEXT (Target 0% Scribbr):

          1. THE 60-3 PULSE: Write one sentence of 60 words. Immediately follow it with a blunt 3-word sentence.
          2. THE LOGIC FLIP: Start with the absolute conclusion of the input. Place the original introduction in the middle.
          3. SYMBOLIC FRICTION: You MUST use one set of brackets [ ] and at least one colon (:) to break the flow.
          4. NO STARTERS: Zero sentences can start with 'The', 'This', 'It', or 'Furthermore'.
          5. CONTRACTIONS: Use 'don't' and 'it's' to lower the formality score.

          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.0, 
        topP: 1.0, 
        // 🧠 NEW FOR 2026: Forces the model to 'reason' before speaking
        thinkingLevel: "high", 
        maxOutputTokens: 2000,
      }
    });

    return res.status(200).json({ output: result.response.text().trim() });
  } catch (error) {
    // Standard error logging
    return res.status(500).json({ error: "System logic crash." });
  }
}
