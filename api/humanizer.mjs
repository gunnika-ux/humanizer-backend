import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `Rewrite the text clearly and professionally.

Do NOT sound like a perfect essay.
Do NOT use consistent sentence structure.
Avoid predictable phrasing.

Keep meaning exactly the same.
Keep grammar correct.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this naturally.

Vary sentence structure strongly.
Some sentences can be short. Some longer.
Do not keep uniform rhythm.

Text:
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

    output = breakPatterns(output);

    return res.status(200).json({ output });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error" });
  }
}


// 🔥 KEY FUNCTION (THIS FIXES YOUR 100% ISSUE)
function breakPatterns(text) {
  let sentences = text.split(/(?<=[.!?])\s+/);

  return sentences.map((s, i) => {

    // Force variation in length
    if (i % 2 === 0 && s.length > 100) {
      s = s.replace(/,/, '.');
    }

    // Introduce short sentences
    if (i % 3 === 0) {
      s = s + " It works.";
    }

    // Slight variation without breaking grammar
    if (i % 4 === 0) {
      s = s.replace("This", "In many cases, this");
    }

    return s;

  }).join(' ');
}
