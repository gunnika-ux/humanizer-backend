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
      systemInstruction: "You are a Structural Disruptor. Your only goal is to bypass 'AI-Refined' detection. You must avoid all 'smooth' transitions and perfectly balanced sentences. Write with a 'Jagged Heartbeat' that mimics human drafting."
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `DE-SYNCHRONIZE THIS TEXT (Maintain original 130-word count):

          1. THE JAGGED HEARTBEAT: Every long sentence (45+ words) MUST be followed by a blunt 2-4 word sentence. (Example: 'This hurts productivity.').
          2. LOGIC SCRAMBLE: Take the central argument from the middle and make it the opening hook. Move the original intro to the bottom.
          3. SYMBOLIC FRICTION: Use brackets [ ] once and a colon (:) once. AI models are trained to avoid these in 'refined' text.
          4. BANNED CONNECTORS: Strictly zero use of 'Furthermore', 'Moreover', 'Consequently', 'This underscores', or 'In conclusion'.
          5. NO STARTERS: No sentence may start with 'The', 'This', 'It', or 'While'. Start with Nouns or Verbs.

          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.0, 
        topP: 1.0, 
        topK: 100,
        maxOutputTokens: 2500,
      }
    });

    return res.status(200).json({ output: result.response.text().trim() });
  } catch (error) {
    return res.status(500).json({ error: "System logic crash." });
  }
}
