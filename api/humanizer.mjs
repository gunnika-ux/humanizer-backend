import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text" });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a professional academic editor.
      CRITICAL: You MUST complete every sentence. Never stop mid-paragraph.
      CRITICAL: Match the input word count exactly. No fluff.

      ACADEMIC HUMANIZATION (12% Scribbr Target):
      1. SCHOLARLY JITTER: Use high-level vocabulary but vary sentence length (Long-Long-Short).
      2. PROFESSIONAL FRICTION: Use transitions like 'Paradoxically,' 'At its core,' or 'In this light.'
      3. NO AI MARKERS: Strictly forbid 'Furthermore', 'Moreover', 'In addition', or 'In conclusion'.
      4. ACADEMIC TONE: Use sophisticated verbs (scrutinize, catalyze, obfuscate) but keep the rhythm human.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `TASK: Humanize this text for a professional journal. Complete the entire text.
          Mirror the word count exactly. 
          
          INPUT: "${text}"`
        }]
      }],
    generationConfig: {
  temperature: 1.0, 
  topP: 0.95,       
  maxOutputTokens: 2000, // Lowering this from 4000 to 2000 helps the engine finish faster
    }
    });

    const response = await result.response;
    let output = response.text().trim();

    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

    // Final safety check to make sure it didn't cut off
    if (!output.endsWith('.') && !output.endsWith(')') && !output.endsWith(']')) {
        output += ".. [Engine completion error. Please shorten text and try again.]";
    }

    return res.status(200).json({ output: output });

  } catch (error) {
    return res.status(500).json({ error: "Sync error. Try again." });
  }
}
