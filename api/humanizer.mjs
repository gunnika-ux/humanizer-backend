import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const inputWords = text.split(/\s+/).length;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a professional editor. Rewrite the text to be human-passing while maintaining a high-level academic and professional tone.

CORE STRATEGY:
1. NO CLICHÉS: Avoid AI-fingerprint words: 'leverage', 'foster', 'unprecedented', 'tapestry', 'delve'.
2. SENTENCE BURSTINESS: Use a mix of one very long, complex sentence (25+ words) followed by a short, direct statement. 
3. DIRECT CONNECTORS: Do not use 'Furthermore' or 'Moreover'. Use 'Beyond this,' 'In practice,' or simply start the next sentence with the subject.
4. WORD COUNT: Match the original length closely. Do not summarize.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this professionally. Use varied sentence lengths to break AI patterns. 
          Ensure the final word count is nearly identical to the original.

          TEXT:
          "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.75, // Lowered per your request, but high enough to avoid "100% AI" scores
        topP: 0.85,        // Tightens word choice to keep it professional
        maxOutputTokens: 3000,
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

    const outputWords = output.split(/\s+/).length;

    if (outputWords < inputWords * 0.6) {
      return res.status(200).json({
        output: output + " ...[retry for fuller rewrite]"
      });
    }

    return res.status(200).json({ output });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
