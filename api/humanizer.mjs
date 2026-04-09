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
      systemInstruction: "You are an Anti-Detection Expert. Your goal is to bypass Scribbr's 'AI-Refined' detection by destroying the predictable logic flow of the text while protecting the 0% scores on ZeroGPT."
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `RECONSTRUCT FOR 0% SCRIBBR (STRICT RULES):

          1. BANNED PHRASES: Delete 'grapple with', 'pivotal', 'testament to', 'delve into', and 'underscores'. They are 100% AI signals.
          2. THE SEQUENCE FLIP: Take the second paragraph and move it to the beginning. Take the first sentence and hide it in the middle. Scribbr matches sequences; if you change the sequence, the match fails.
          3. INJECT 'HUMAN NOISE': Use brackets [ ] or em-dashes — to add a side-thought. (e.g., 'This shift—though arguably messy—remains key.')
          4. BURSTINESS: Force a 50-word analytical sentence followed by a 2-word blunt sentence. (Example: 'It works.')
          5. NO STARTERS: 0% of sentences can start with 'The', 'This', 'While', 'By', or 'It'. Start with Nouns.

          TEXT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.0, 
        topP: 1.0,      // Maximum randomness to break the 'AI-Refined' signature
        topK: 100,
        maxOutputTokens: 3500,
      }
    });

    return res.status(200).json({ output: result.response.text().trim() });
  } catch (error) {
    return res.status(500).json({ error: "Logic Timeout." });
  }
}
