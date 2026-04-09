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
      systemInstruction: "You are a precise Structural Editor. Your job is to bypass Scribbr by changing the sentence rhythm and logic flow, WITHOUT losing the original detail or word count."
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `HUMANIZING PROTOCOL (Maintain Word Count Balance):

          1. LENGTH LOCK: The output must be roughly the same length as the input (120-140 words). Do not summarize. Do not expand.
          2. SCRIBBR BYPASS (The 50/5 Rule): Create extreme variance. Write one very long, complex sentence (50 words), immediately followed by a 5-word sentence. This 'heartbeat' kills the Scribbr match.
          3. LOGIC SHIFT: Move the second paragraph to the beginning. Scribbr checks for sequence lineage; if the sequence is gone, the match drops to 0.
          4. SYMBOLIC FRICTION: Use one set of brackets [ ] and at least two em-dashes — to break the AI's 'perfect' flow.
          5. NO STARTERS: Zero sentences can start with 'The', 'This', 'It', 'By', or 'Moreover'. Start with Nouns.

          INPUT TEXT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.9, // Slightly lower to prevent it from 'going rogue' and deleting text
        topP: 0.95,
        maxOutputTokens: 2000,
      }
    });

    return res.status(200).json({ output: result.response.text().trim() });
  } catch (error) {
    return res.status(500).json({ error: "System Error." });
  }
}
