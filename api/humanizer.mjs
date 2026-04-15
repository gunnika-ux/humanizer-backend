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
- Rewrite the text fully while preserving meaning.
- Keep a semi-professional tone (not casual, not academic).
- Avoid perfectly structured or overly polished writing.
- Do NOT sound like a formal essay or textbook.
- Do NOT summarize or remove details.
- Keep output length close to input, but do not add fluff.

HUMAN STYLE RULES:
1. Mix sentence lengths unevenly.
2. Occasionally break flow slightly between sentences.
3. Allow mild redundancy or natural rephrasing.
4. Use simpler phrasing in some places instead of complex wording.
5. Avoid consistently perfect transitions.
6. Insert occasional short sentences (3–6 words).
7. Keep tone professional, but not overly refined.

IMPORTANT:
The writing should feel like a real person explaining ideas clearly, not like an optimized AI-generated article.`
    });

    let output = "";

    // 🔁 Retry loop (ensures good length + quality)
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `Rewrite the text naturally while preserving all ideas.

Keep the tone clear and professional, but not overly polished.
Allow slight imperfections and variation in flow.

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

      // ✅ Length check (avoid too short outputs)
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
