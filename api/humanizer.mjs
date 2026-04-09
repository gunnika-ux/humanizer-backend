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
      // SYSTEM INSTRUCTION: Tells the AI to PROTECT the words that ZeroGPT likes.
      systemInstruction: "You are a Structural Editor. Keep the existing high-level vocabulary (like quandary, paradigm, enclaves) but SHUFFLE the sentence lengths to bypass Scribbr."
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Apply 'Syntactic Inversion' to this text. 

          1. PROTECT THE WORDS: Do not change the heavy academic words. ZeroGPT and Quillbot like them.
          2. BREAK THE RHYTHM: Scribbr detects the 'flow'. You must change the order of the ideas. Start with the middle of the paragraph and move the beginning to the end.
          3. THE JAGGED RULE: One sentence must be 50 words long. The very next sentence must be 3 words long. This 'Jagged' rhythm is 0% on Scribbr.
          4. USE SYMBOLS: Use a dash (—) or brackets [] to break a sentence in half. This destroys the AI fingerprint.

          TEXT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.9, // Balanced to keep the good words but change the structure
        topP: 0.95,
        maxOutputTokens: 3000,
      }
    });

    return res.status(200).json({ output: result.response.text().trim() });
  } catch (error) {
    return res.status(500).json({ error: "API Error" });
  }
}
