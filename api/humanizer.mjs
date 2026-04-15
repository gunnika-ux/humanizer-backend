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
      systemInstruction: `Rewrite the text like a real human.

CRITICAL:
- Keep meaning exactly the same
- Keep grammar correct
- Do NOT summarize

STYLE:
- Do NOT follow the same structure as the input
- Change how ideas are arranged slightly
- Avoid clean transitions (no "However", "In conclusion", etc.)
- Mix short and long sentences
- Allow slight breaks in flow

IMPORTANT:
The output should NOT feel like a structured essay. It should feel naturally written and slightly uneven.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this text naturally.

Keep meaning same.
Avoid structured flow.

TEXT:
"${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.92,
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
