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
      systemInstruction: "You are a specialized Stealth-Humanizer. Your task is to bypass Scribbr and Quillbot by destroying 'Neural Symmetry'. You must use erratic sentence lengths, obscure (but academic) synonyms, and non-linear logic. If the input is formal, make the output 'Aggressively Academic' with high syntactic complexity."
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `DE-MODULATE THIS TEXT FOR 0% DETECTION:

          1. PARAGRAPH SHIFT: Move the core argument of each paragraph to the middle, not the start.
          2. SYNTACTIC NOISE: Every sentence must have a different structure than the one before it. 
             - Sentence 1: Complex (40+ words) with multiple commas.
             - Sentence 2: Fragmented or Short (3-6 words).
             - Sentence 3: Passive voice with parenthetical asides.
          3. FORBIDDEN STARTERS: If a sentence starts with 'The', 'This', 'It', 'Moreover', 'In', or 'By', the output is a failure. 
          4. UNLIKELY DICTION: Use words like 'quandary', 'tensions', 'paradigm', 'clash', or 'weighty'. Avoid all standard AI transition words.
          5. NO SUMMARIZATION: Increase the depth. Add one specific example or 'case-in-point' to each section to expand the word count.

          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.0, 
        topP: 1.0,       // Max entropy: This is the only way to kill the 100% Scribbr match
        topK: 100,
        maxOutputTokens: 4000,
      }
    });

    return res.status(200).json({ output: result.response.text().trim() });
  } catch (error) {
    return res.status(500).json({ error: "System crash. Try smaller text." });
  }
}
