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
      systemInstruction: `Rewrite the text like a real person explaining ideas.

CRITICAL:
- Keep meaning exactly the same
- Keep grammar correct
- Do NOT summarize
- Do NOT sound like a formal essay

STYLE:
- Break strict paragraph flow
- Allow slight topic jumps (natural, not random)
- Mix direct statements with explanation
- Avoid perfect logical progression
- Keep tone professional but relaxed

IMPORTANT:
The text should feel written naturally, not structured like an optimized article.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this text.

Rules:
- Keep meaning same
- Keep professional tone
- Do NOT make it sound like a polished article
- Allow slight natural irregularity in flow

TEXT:
"${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.65,
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
