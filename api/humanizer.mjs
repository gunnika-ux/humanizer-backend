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
      systemInstruction: `You are a professional human editor.

CRITICAL:
- Keep meaning exactly the same
- Keep grammar correct
- Do NOT summarize or remove ideas
- Keep output length close to input

STYLE:
- Use burstiness: mix long sentences with short ones
- Avoid repeating sentence structure
- Do NOT keep a smooth or predictable rhythm
- Avoid overly polished or academic tone
- Occasionally use direct, simple sentences

IMPORTANT:
The writing should feel natural, slightly uneven, and human — not structured like an AI-generated article.`
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
- Vary sentence length and rhythm

TEXT:
"${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.6,   // 🔥 fixed (very important)
        topP: 0.9,
        maxOutputTokens: 2000,
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

    return res.status(200).json({ output });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
