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
      systemInstruction: `Rewrite the text like a human writer.

CRITICAL:
- Keep meaning exactly the same
- Keep grammar correct
- Do NOT summarize

STYLE:
- Vary sentence length naturally (short + long)
- Avoid repeating sentence structure
- Use occasional interruptions (dashes or side notes)
- Keep tone professional but slightly informal

IMPORTANT:
Keep the output roughly similar in length, but do not force exact matching.
Avoid overly perfect or overly chaotic structure.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this text naturally.

Keep meaning same.
Keep similar length.
Avoid predictable patterns.

TEXT:
"${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.72,   // 🔥 lowered from 0.84
        topP: 0.92,
        maxOutputTokens: 3000,
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

    const outputWords = output.split(/\s+/).length;

    // softer check (no aggressive retry message)
    if (outputWords < inputWords * 0.6) {
      return res.status(200).json({
        output: output
      });
    }

    return res.status(200).json({ output });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
