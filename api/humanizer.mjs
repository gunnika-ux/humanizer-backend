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
      systemInstruction: `You rewrite text like a real human.

CRITICAL:
- Keep the meaning exactly the same.
- Keep grammar correct.
- Do NOT summarize or remove ideas.
- Avoid sounding like a perfect essay.

STYLE RULES:
- Vary sentence length significantly.
- Some sentences should be short. Some longer.
- Do NOT keep consistent rhythm.
- Avoid predictable transitions.
- Occasionally use direct, simple sentences.
- Do NOT over-polish the writing.

IMPORTANT:
The text must feel naturally written, not optimized or uniform.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this text.

Requirements:
- Keep meaning unchanged
- Keep professional tone
- Break uniform sentence structure
- Do not make all sentences flow smoothly

TEXT:
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

    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

    return res.status(200).json({ output });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
