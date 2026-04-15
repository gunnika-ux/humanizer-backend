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
- Do NOT summarize or remove ideas
- Do NOT sound like a formal essay or textbook

STYLE:
- Vary sentence length noticeably (mix short and long sentences)
- Avoid repeating the same sentence structure
- Do NOT keep a smooth or predictable rhythm
- Occasionally use direct, simple sentences
- Avoid perfectly balanced paragraph structure
- Allow slight shifts in tone between sentences
- Use simpler phrasing in some places instead of complex wording

IMPORTANT:
The writing should feel natural and slightly uneven, not optimized or structured like AI-generated content.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this text.

Rules:
- Keep meaning unchanged
- Keep professional tone
- Avoid perfect structure or flow
- Allow slight natural irregularity

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

    // Clean unwanted prefixes
    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

    return res.status(200).json({ output });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
