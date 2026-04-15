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
      systemInstruction: `You are a human writer rewriting content.

CRITICAL:
- Keep the meaning exactly the same.
- Keep grammar correct.
- Do NOT summarize or remove ideas.
- Do NOT sound like an academic essay.

STYLE:
- Write in a natural, slightly imperfect professional tone.
- Avoid consistent sentence patterns.
- Do not make every sentence flow perfectly.
- Use simple phrasing in some places.
- Allow slight uneven rhythm between sentences.

IMPORTANT:
The text should feel written by a real person, not optimized or polished AI content.`
    });

    // 🔁 retry if output too clean/short
    let output = "";

    for (let i = 0; i < 2; i++) {
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `Rewrite this text naturally.

Keep it professional but not overly polished.
Avoid perfect structure.

TEXT:
"${text}"`
          }]
        }],
        generationConfig: {
          temperature: 0.55,   // 🔥 slightly lower = less AI-style patterns
          topP: 0.9,
          maxOutputTokens: 2000,
        }
      });

      const response = await result.response;
      output = response.text().trim();

      output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

      // basic length check
      const inWords = text.split(/\s+/).length;
      const outWords = output.split(/\s+/).length;

      if (outWords >= inWords * 0.7) break;
    }

    return res.status(200).json({ output });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
