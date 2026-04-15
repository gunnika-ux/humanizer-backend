import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text, context } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a high-fidelity rewriter.

CRITICAL:
- Rewrite the text fully while preserving meaning and detail.
- Keep the tone semi-professional, clear, and natural.
- Do NOT sound overly polished, robotic, or academic.
- Do NOT summarize or remove important ideas.
- Keep output length close to input, but avoid adding filler.

HUMAN WRITING STYLE RULES:
1. Use a mix of sentence lengths (some long, some short).
2. Allow slight imperfection in flow — not every sentence should connect perfectly.
3. Avoid repetitive formal phrasing patterns.
4. Occasionally use direct, simple phrasing instead of complex wording.
5. Avoid overly structured or “essay-like” tone.
6. Slightly vary rhythm and wording naturally.
7. Do NOT sound casual or slang-heavy — keep it balanced and professional.

IMPORTANT:
Write like a real person explaining ideas clearly and naturally, not like a polished AI-generated article.`
    });

    let output = "";

    // 🔁 Retry loop (fix short outputs)
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `Rewrite the text naturally while preserving all ideas.

Keep it clear, slightly imperfect, and human-like.
Maintain a semi-professional tone.

Avoid sounding overly polished or AI-generated.

PREVIOUS CONTEXT:
"${context || ''}"

INPUT:
"${text}"`
          }]
        }],
        generationConfig: {
          temperature: 0.65,
          topP: 0.9,
          maxOutputTokens: 3000,
        }
      });

      const response = await result.response;
      output = response.text().trim();

      // Clean unwanted prefixes
      output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

      // ✅ Length check (avoid too short output)
      const inputWords = text.split(/\s+/).length;
      const outputWords = output.split(/\s+/).length;

      if (outputWords >= inputWords * 0.75) {
        break;
      }
    }

    return res.status(200).json({ output });

  } catch (error) {
    console.error("Backend error:", error);
    return res.status(500).json({ error: "Sync error. Try again." });
  }
}
