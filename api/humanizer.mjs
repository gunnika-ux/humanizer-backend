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

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a professional human rewriter.

CRITICAL:
- Rewrite the text fully while preserving meaning.
- Keep grammar correct and tone professional.
- Do NOT summarize or remove important ideas.
- Do NOT sound like a perfect academic essay.

STYLE RULES:
- Vary sentence length naturally (mix short and long).
- Avoid consistent sentence rhythm.
- Avoid repetitive phrasing patterns.
- Keep flow slightly uneven but still readable.
- Occasionally merge or split ideas in less predictable ways.
- Avoid perfectly balanced paragraph structure.
- Allow slight shifts in tone between sentences.
- Use simple phrasing in some places instead of complex wording.

IMPORTANT:
The writing should feel natural and human, not optimized or overly polished.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this text naturally.

Requirements:
- Keep meaning unchanged
- Maintain professional tone
- Avoid perfect structure
- Keep slight natural variation in flow

TEXT:
"${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.6,
        topP: 0.9,
        maxOutputTokens: 2000,
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    // Clean unwanted prefixes
    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

    return res.status(200).json({ output });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
