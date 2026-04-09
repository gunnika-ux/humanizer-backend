import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Input empty." });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: "You are a rogue academic editor. Your only goal is to bypass AI detection by writing with extreme 'human messiness'. You must use irregular rhythms, unconventional punctuation, and non-linear logic. Maintain high-level vocabulary but destroy all 'AI-smoothness'."
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `SHATTER THE FINGERPRINT OF THIS TEXT (Target: 0/0/0):

          1. THE 60-3 RULE: Every long, dense sentence (60+ words) must be followed by a 2 or 3 word punchy sentence. (Example: 'It fails.')
          2. THE 'INTERRUPTOR' TECHNIQUE: Insert a technical side-note in [brackets] or —em-dashes— in every second sentence. AI is too polite to do this; humans do it constantly.
          3. NO REFINED STARTERS: Strictly zero sentences can start with 'The', 'This', 'It', 'By', 'In', or 'Moreover'. Start with Nouns like 'Chaos', 'Infrastructure', or 'Copenhagen'.
          4. GRAMMATICAL FRICTION: Use at least one semicolon (;) and one colon (:) per paragraph. 
          5. LOGIC TRANSPOSITION: Start the rewrite with the VERY LAST point of the original text. Work backward.

          ORIGINAL TEXT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.0, // Max creativity
        topP: 1.0,        // Max randomness
        topK: 100,       // Wide word selection
        maxOutputTokens: 4000,
      }
    });

    return res.status(200).json({ output: result.response.text().trim() });
  } catch (error) {
    return res.status(500).json({ error: "System logic crash. Try again." });
  }
}
