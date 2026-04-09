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
      systemInstruction: "You are a Structural Saboteur. Your goal is to bypass Scribbr's document-lineage check by destroying the rhythmic 'AI-fingerprint' while locking in the 0% vocabulary from ZeroGPT."
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `SHATTER THE DNA OF THIS TEXT:

          1. THE 60-3 HEARTBEAT: You must force an extreme rhythm. Write a 60-word winding analytical sentence. Follow it immediately with a 3-word blunt punch. (e.g., 'It just works.')
          2. SEQUENCE SCRAMBLE: Take your final paragraph and move it to the beginning. Move the intro to the middle. Scribbr matches the 'order of ideas'—if you flip the order, the match fails.
          3. HUMAN INTERRUPTIONS: Insert a side-thought in [brackets] or —em-dashes— in every second sentence. This is 'Syntactic Noise' that AI never generates naturally.
          4. PROTECT VOCAB: Do not change words like 'paradigm' or 'quandary'. They are keeping ZeroGPT at 0%.
          5. NO AI TRANSITIONS: Ban 'Moreover', 'In addition', and 'Consequently'. Replace with blunt starters like 'Money', 'Chaos', or 'Copenhagen'.

          TEXT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.0, 
        topP: 1.0,    // Max Entropy: Crucial for breaking Scribbr's probability model
        topK: 100,
        maxOutputTokens: 3000,
      }
    });

    return res.status(200).json({ output: result.response.text().trim() });
  } catch (error) {
    return res.status(500).json({ error: "Logic Timeout." });
  }
}
