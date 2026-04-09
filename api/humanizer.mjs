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
      systemInstruction: "You are a Senior Academic Ghostwriter. Your goal is to rewrite text so that its structural DNA is unrecognizable to Scribbr and Turnitin while maintaining high-tier intellectual depth."
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this using 'Non-Linear Transposition' to kill the 60% Scribbr match.

          STRICT DNA-BREAKING RULES:
          1. THE SIDE-NOTE: Every paragraph must contain a technical clarification inside parentheses (like this) to break the smooth AI flow.
          2. STARTING BAN: 0% of sentences can start with 'The', 'This', 'It', 'While', 'Research', or 'By'. Start with Action Verbs or rare Nouns.
          3. LOGIC FLIP: If the original says 'A leads to B', start your rewrite with 'B is often a consequence of A'. 
          4. BURSTINESS: Force a 45-word complex analytical sentence to be followed by a 3-word blunt sentence.
          5. BANNED WORDS: Delete 'pivotal', 'comprehensive', 'underscores', 'fosters'. Use 'weighty', 'total', 'points to', 'triggers'.

          TEXT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.0, 
        topP: 0.95,   // Nuclear setting to destroy the 20% ZeroGPT signature
        topK: 60,
        maxOutputTokens: 3500,
      }
    });

    return res.status(200).json({ output: result.response.text().trim() });
  } catch (error) {
    return res.status(500).json({ error: "Internal Engine Error." });
  }
}
