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
      systemInstruction: `You are a professional human rewriter.

CRITICAL:
- Rewrite the text fully without changing meaning.
- Keep grammar correct and tone professional.
- Avoid overly perfect or academic writing.
- Do NOT summarize or remove details.

STYLE RULES:
- Vary sentence lengths naturally.
- Avoid repetitive phrasing patterns.
- Do not make every sentence flow perfectly.
- Keep tone slightly uneven but still professional.
- Avoid predictable transitions.`
    });

    let output = "";

    // Retry loop
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `Rewrite naturally and clearly.

Keep it professional but not overly polished.

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

      output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

      const inputWords = text.split(/\s+/).length;
      const outputWords = output.split(/\s+/).length;

      if (outputWords >= inputWords * 0.75) break;
    }

    // 🔥 ANTI-DETECTION LAYER (IMPORTANT)
    output = humanizeStructure(output);

    return res.status(200).json({ output });

  } catch (error) {
    console.error("Backend error:", error);
    return res.status(500).json({ error: "Sync error. Try again." });
  }
}


// 🔥 CORE HUMANIZATION FUNCTION
function humanizeStructure(text) {
  let sentences = text.split(/(?<=[.!?])\s+/);

  return sentences.map((s, i) => {

    // Break overly long sentences occasionally
    if (s.length > 140 && i % 3 === 0) {
      s = s.replace(/, and /, '. ');
    }

    // Slight phrasing variation
    if (i % 4 === 0) {
      s = s.replace(/In order to/g, 'To');
      s = s.replace(/It is important to note that/g, '');
    }

    // Reduce perfect transitions
    if (i % 5 === 0) {
      s = s.replace(/Furthermore,|Moreover,/g, '');
    }

    // Slight natural variation (no grammar break)
    if (i % 6 === 0 && s.length > 60) {
      s = s.replace(/\. /, '. ');
    }

    return s.trim();

  }).join(' ');
}
