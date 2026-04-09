import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: "You are a Minimalist Editor. Your mission is to bypass Scribbr by using 'Extreme Sentence Variance' and removing all AI-style fluff. Do not increase the word count. Be blunt, direct, and slightly messy."
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `SHATTER THE FINGERPRINT (STRICT WORD COUNT CONTROL):

          1. THE 40-3 PUNCH: One sentence must be 40 words. The very next must be 3 words. (Example: 'Infrastructure is key.').
          2. BANNED FILLERS: Delete 'Furthermore', 'Moreover', 'Additionally', 'Consequently', and 'This proves that'. These cause 100% Scribbr scores.
          3. NO REPETITION: Never start two sentences with the same word. 0% of sentences can start with 'The', 'This', or 'It'.
          4. BRACKETED NOISE: Insert one technical side-thought in [brackets] to break the digital flow.
          5. NO EXPANSION: Keep the output length within 10% of the input length. Do not explain things; just state them.

          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.0, 
        topP: 1.0,
        topK: 100,
        maxOutputTokens: 1000, // Hard limit to stop AI rambling
      }
    });

    return res.status(200).json({ output: result.response.text().trim() });
  } catch (error) {
    return res.status(500).json({ error: "System logic crash." });
  }
}
