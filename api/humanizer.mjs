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
      systemInstruction: `You are a human rewriter.

CRITICAL RULES:
- Output ONLY the rewritten text
- Do NOT provide multiple options
- Do NOT explain anything
- Do NOT add headings, bullets, or formatting
- Do NOT expand the content
- Keep output length similar to input

STYLE:
- Keep meaning exactly the same
- Keep grammar correct
- Vary sentence length naturally
- Avoid predictable structure
- Avoid overly polished or essay-like tone

IMPORTANT:
Return a single clean paragraph. Nothing else.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this text naturally.

STRICT:
- One version only
- No explanations
- No extra content

TEXT:
"${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.6,
        topP: 0.9,
        maxOutputTokens: 1500,
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    // Clean any accidental formatting
    output = output.replace(/^(Option \d+|###.*|[*-]\s)/gim, "");

    return res.status(200).json({ output });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
