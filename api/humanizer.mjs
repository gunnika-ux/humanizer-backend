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

    // 🔹 PASS 1: FULL CLEAN REWRITE (stable)
    const pass1 = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this clearly and professionally. Keep full meaning and full length.

"${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.5,
        topP: 0.9,
        maxOutputTokens: 3000,
      }
    });

    const cleanText = (await pass1.response).text().trim();

    // 🔹 PASS 2: HUMANIZE (adds variation, lowers AI score)
    const pass2 = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this again to sound naturally human.

Rules:
- Keep meaning exactly the same
- Keep similar length
- Vary sentence length
- Avoid perfect structure
- Keep it readable and professional

TEXT:
"${cleanText}"`
        }]
      }],
      generationConfig: {
        temperature: 0.72,
        topP: 0.92,
        maxOutputTokens: 3000,
      }
    });

    let output = (await pass2.response).text().trim();

    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

    return res.status(200).json({ output });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
