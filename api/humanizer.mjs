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
      systemInstruction: "You are a Structural Disruptor. Your mission is to maintain the successful 0% vocabulary from ZeroGPT while completely scrambling the sequence of ideas to bypass Scribbr's database matching."
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `STRICT SCRIBBR BYPASS (Protect the 0% ZeroGPT/Quillbot vocabulary):

          1. LOGIC TRANSPOSITION: Take the final point of the input text and move it to the beginning. Put the introduction in the middle. 
          2. THE BURSTINESS RULE: Use 'Extreme Burstiness'. Write a 55-word complex sentence, then a 3-word blunt sentence. AI cannot simulate this 'heartbeat' rhythm.
          3. HUMAN FILLERS: Sprinkle in natural human phrases like 'Basically', 'To be honest', or 'The thing is'. This confuses Scribbr's probability model.
          4. GRAMMATICAL FRICTION: Use one set of brackets [ ] and one colon (:) per paragraph. 
          5. NO REPEATED OPENERS: Zero sentences can start with 'The', 'This', 'It', or 'Moreover'. Start with Nouns or -ing verbs.

          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.0, 
        topP: 1.0,        // Max randomness is the only way to kill the 100% match
        topK: 100,
        maxOutputTokens: 4000,
      }
    });

    return res.status(200).json({ output: result.response.text().trim() });
  } catch (error) {
    return res.status(500).json({ error: "System logic error." });
  }
}
