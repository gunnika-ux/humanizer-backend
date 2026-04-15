import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `Rewrite the text clearly and professionally.

CRITICAL:
- Keep meaning exactly the same.
- Maintain correct grammar.
- Avoid overly perfect or academic tone.
- Do NOT repeat phrases unnaturally.
- Do NOT follow predictable sentence patterns.

STYLE:
- Vary sentence length naturally.
- Keep flow slightly uneven but readable.
- Use subtle variation, not obvious tricks.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite naturally.

Keep it professional and human.
Avoid repetition patterns.

Text:
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

    output = cleanText(output);

    return res.status(200).json({ output });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error" });
  }
}


// 🔥 CLEAN HUMANIZER (NO FAKE PATTERNS)
function cleanText(text) {
  let sentences = text.split(/(?<=[.!?])\s+/);

  return sentences.map(s => {
    // Remove accidental repetition
    s = s.replace(/\b(It works\.)+/g, '');

    // Light natural variation (safe)
    s = s.replace(/In order to/g, 'To');
    s = s.replace(/It is important to note that/g, '');

    return s.trim();
  }).join(' ');
}
