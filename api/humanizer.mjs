import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Missing text." });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: "You are a professional Humanizer. Your mission: Destroy the 'Neural Symmetry' that Scribbr and Turnitin detect. You must write with extreme structural irregularity while preserving the high-level vocabulary that ZeroGPT already likes."
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `RECONSTRUCT FOR 0% DETECTION:

          1. THE 60-3 RULE: You must write one extremely long, winding sentence (60+ words). Immediately follow it with a blunt, 3-word sentence. (Example: 'It just fails.')
          2. THE INTERRUPTOR: Insert a technical side-thought in [brackets] or —em-dashes— in every second sentence. AI is too 'clean' to do this; humans do it constantly.
          3. LOGIC TRANSPOSITION: Start the rewrite with the VERY LAST point of the original text. Move the opening sentence to the middle. This breaks the 'Sequence Match' Scribbr uses.
          4. NO 'POINTER' STARTERS: Zero sentences can start with 'The', 'This', 'It', 'By', or 'Moreover'. Start with Nouns or Gerunds (-ing verbs).
          5. PROTECT VOCAB: Keep the words 'quandary', 'paradigm', 'clash', and 'weighty'. They are working for ZeroGPT.

          TEXT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.0, 
        topP: 1.0,    // Maximum entropy to destroy the AI signature
        topK: 100,
        maxOutputTokens: 4000,
      }
    });

    return res.status(200).json({ output: result.response.text().trim() });
  } catch (error) {
    return res.status(500).json({ error: "Internal Logic Crash." });
  }
}
