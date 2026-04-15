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
      model: "gemini-3-flash-preview"
    });

    // 🔹 PASS 1: clean rewrite
    const firstPass = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this text clearly and professionally without changing meaning:

"${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.5,
        topP: 0.9,
        maxOutputTokens: 2000,
      }
    });

    let intermediate = (await firstPass.response).text().trim();

    // 🔹 PASS 2: human variation pass
    const secondPass = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this again to sound more naturally human.

Rules:
- Vary sentence length strongly
- Break predictable flow
- Avoid consistent structure
- Keep meaning identical
- Keep grammar correct
- Do NOT make it overly polished

TEXT:
"${intermediate}"`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2000,
      }
    });

    let output = (await secondPass.response).text().trim();

    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

    return res.status(200).json({ output });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
