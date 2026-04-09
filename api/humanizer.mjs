import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No input found." });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: "You are a Senior Research Editor. Your objective is to destroy the structural DNA of AI-generated text. You must break every predictable pattern while maintaining high-level academic complexity."
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `RECONSTRUCT THIS TEXT (Target: 0% Scribbr/Quillbot):

          THE ARCHITECTURAL RULES:
          1. THE LOGIC FLIP: You must reverse the order of your sentences within every paragraph. If the original text ended with a conclusion, start your rewrite with that conclusion.
          2. THE INTERRUPTOR: Every second sentence must include a technical side-thought in parentheses (like this) or between em-dashes —like this—. AI never interrupts its own flow; humans do.
          3. NO ROBOT STARTERS: You are strictly banned from starting any sentence with 'The', 'This', 'While', 'By', 'It', or 'Moreover'. Start with Nouns or Verbs.
          4. THE JAGGED HEARTBEAT: Alternate your sentence lengths: 45 words, then 4 words. 45 words, then 4 words.
          5. WORD SABOTAGE: Replace 'pivotal' with 'weighty', 'comprehensive' with 'total', 'underscores' with 'points to'.

          TEXT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.0, 
        topP: 0.98,   // Nuclear setting: Forces the model to avoid all 'likely' word paths
        topK: 100,
        maxOutputTokens: 3500,
      }
    });

    return res.status(200).json({ output: result.response.text().trim() });
  } catch (error) {
    return res.status(500).json({ error: "Structural logic crash. Try again." });
  }
}
