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
      // SYSTEM INSTRUCTION UPDATED FOR SCRIBBR:
      systemInstruction: "You are a Structural Disruptor. Your mission is to maintain the successful 0% vocabulary from ZeroGPT/Quillbot while completely scrambling the sequence of ideas to bypass Scribbr's database matching."
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `STRICT STRUCTURAL RECONSTRUCTION (Keep the vocabulary exactly as is):

          1. LOGIC REVERSAL: Start the rewrite with the CONCLUSION of the input text. Move the opening sentence to the middle. This destroys Scribbr's sequence match.
          2. THE 'HUMAN' PAIRED-RHYTHM: Write one extremely long, winding sentence (50+ words) and follow it immediately with a 2-word punchy sentence. (Example: 'Paradigm shifts—while often burdensome—trigger total evolution. It works.')
          3. INTERRUPTED SYNTAX: Use em-dashes (—) to break sentences in the middle. AI is too 'clean'; humans interrupt themselves.
          4. FORBIDDEN STARTERS (KEEP THESE): No 'The', 'This', 'It', 'In', 'By', 'Moreover'.
          5. PROTECT DICTION: Keep the words 'quandary', 'paradigm', 'clash', and 'weighty'. They are working.

          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.95, // Dropped 0.05 to prevent the 'spoiling' of good words
        topP: 0.98,        
        topK: 100,
        maxOutputTokens: 4000,
      }
    });

    return res.status(200).json({ output: result.response.text().trim() });
  } catch (error) {
    return res.status(500).json({ error: "Logic error." });
  }
}
