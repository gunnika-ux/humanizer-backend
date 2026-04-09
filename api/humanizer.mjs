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
      systemInstruction: "You are an exhausted academic editor. Your goal is to rewrite text so it looks like a rough human draft. Use inconsistent sentence lengths and stop being 'helpful' or 'clear'. Efficiency is the enemy."
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `SCRAMBLE AND ROUGHEN (Target: 0% Scribbr, maintain word count):

          1. THE JAGGED PULSE: Sentence 1: 50 words. Sentence 2: 3 words. Sentence 3: 12 words. AI naturally hates this 'unbalanced' rhythm. 
          2. THE 'MID-THOUGHT' DASH: You MUST use an em-dash — or brackets [ ] in the middle of a complex sentence to interrupt the logic flow.
          3. NO AI STARTERS: Strictly zero sentences can start with 'The', 'This', 'It', 'Furthermore', or 'By'. Start with Nouns.
          4. LOGIC FLIP: Put the conclusion at the top. Scribbr detects the 'flow' of arguments; if you flip the flow, the DNA match breaks.
          5. CONTRACTIONS: Use 'don't', 'can't', or 'it's'. AI models default to formal 'do not'—Scribbr flags that formality.

          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.0, 
        topP: 1.0, 
        topK: 100,
        maxOutputTokens: 2000,
      }
    });

    return res.status(200).json({ output: result.response.text().trim() });
  } catch (error) {
    return res.status(500).json({ error: "System logic crash." });
  }
}
