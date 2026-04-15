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
      systemInstruction: `You are a professional human editor. 

CRITICAL:
- Keep meaning exactly the same
- Keep grammar correct
- Do NOT summarize
- Keep word count close to the original (±10%)

DETECTOR BYPASS STYLE:
- Use "Burstiness": mix very long, detailed sentences with short, punchy ones.
- Never use AI transitions: BANNED words include 'Furthermore', 'Moreover', 'Additionally', 'In conclusion', and 'Notably'.
- Use active, direct verbs.
- Avoid repeating sentence structures.
- Do NOT keep a smooth or perfect flow; humans are slightly unpredictable in how they transition between thoughts.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this text to be completely undetectable by AI detectors. 

Keep meaning same.
Maintain a professional but natural length.
Break the predictable AI rhythm.

TEXT:
"${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.82, // Higher temperature beats detectors by picking less predictable words
        topP: 0.95,
        maxOutputTokens: 3000,
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

    const outputWords = output.split(/\s+/).length;

    if (outputWords < inputWords * 0.6) {
      return res.status(200).json({
        output: output + " ...[retry for fuller rewrite]"
      });
    }

    return res.status(200).json({ output });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
