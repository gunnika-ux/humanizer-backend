import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No input." });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: "You are a Senior Editor. Your task is to rewrite text by 'Fracturing' the AI rhythm. You must ignore standard AI flow and use erratic, human-like structural variance."
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this to bypass Scribbr (100% match) and Quillbot. 

          THE FRACTURE RULES:
          1. THE 50-5 PUNCH: Write a very long, complex analytical sentence (50+ words). Immediately follow it with a 3-word sentence. (e.g., 'It just works.')
          2. BAN THE POINTERS: 0% of sentences can start with 'The', 'This', 'It', 'Moreover', or 'By'. 
          3. INVERSION: Flip the logic. Instead of 'AI helps X,' start with 'X is seeing a shift because of...'
          4. INTENTIONAL FRICTION: Use em-dashes (—) or parentheses () to interrupt a sentence with a side-thought. AI never 'interrupts' itself; humans do it constantly.
          5. WORD REPLACEMENT: Replace 'pivotal' with 'weighty', 'comprehensive' with 'total', 'fosters' with 'triggers'.

          TEXT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.0, 
        topP: 0.9,     // CRITICAL: High P breaks the "smooth" 50% Quillbot signature
        topK: 60,      // Allows for more 'human' erratic word choices
        maxOutputTokens: 3000,
      }
    });

    return res.status(200).json({ output: result.response.text().trim() });
  } catch (error) {
    return res.status(500).json({ error: "Logic Crash. Retry." });
  }
}
