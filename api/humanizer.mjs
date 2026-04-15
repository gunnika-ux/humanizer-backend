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

CRITICAL: You are NOT allowed to truncate or stop mid-sentence.
CRITICAL: You must process every sentence fully.
CRITICAL: The output MUST match the input length.
CRITICAL: Do NOT shorten, summarize, or compress content.
CRITICAL: Preserve ALL ideas, details, and structure.

HUMANIZATION RULES:
1. Use natural, slightly imperfect human phrasing.
2. Mix long and short sentences.
3. Avoid robotic transitions.
4. Keep tone consistent with previous context if provided.`
    });

    let output = "";

    // 🔥 Retry loop to fix short outputs
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `TASK: Rewrite the text fully while preserving meaning.

The output MUST match the input length.
Do NOT shorten or summarize under any condition.
If the output becomes shorter, continue writing until length matches.

Maintain tone and flow using previous context if provided.

PREVIOUS CONTEXT:
"${context || ''}"

INPUT TEXT:
"${text}"`
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topP: 0.9,
          maxOutputTokens: 3000,
        }
      });

      const response = await result.response;
      output = response.text().trim();

      // Clean unwanted prefixes
      output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

      // ✅ Check if length is acceptable (80%+)
      const inputWords = text.split(/\s+/).length;
      const outputWords = output.split(/\s+/).length;

      if (outputWords >= inputWords * 0.8) {
        break;
      }
    }

    return res.status(200).json({ output });

  } catch (error) {
    console.error("Backend error:", error);
    return res.status(500).json({ error: "Sync error. Try again." });
  }
}
