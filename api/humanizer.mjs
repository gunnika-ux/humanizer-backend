import { GoogleGenerativeAI } from "@google/generative-ai"; 

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  // 🔐 AUTH CHECK
  const auth = req.headers.authorization;
  if (auth !== process.env.SECRET_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }

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
- Keep the original meaning and key ideas, but allow natural rewording
- Do NOT summarize
- Keep similar length

STYLE:
- Keep grammar correct
- Ensure sentences are logically clear, while keeping the flow slightly uneven and natural
- Avoid perfect structure
- Avoid predictable structure
- Allow slight jumps in ideas, but keep sentences understandable
- Use clear language, but include some specific and descriptive wording where appropriate
- Add slight variation in expression and emphasis to avoid flat or generic tone
- Avoid overly formal tone, but maintain clear and professional wording
- Prefer precise wording over casual fillers
- Avoid repetitive sentence patterns; combine related ideas instead of using separate sentences for emphasis
- Avoid generic language
- Avoid neutral tone
- Include occasional specific or concrete detail and a brief implication or consequence so the writing feels grounded and not generic.
- Vary sentence length naturally without forcing a pattern.
- Use clear and precise wording; avoid exaggerated or overly casual expressions 
- Occasionally vary sentence openings

IMPORTANT:
The text should NOT feel like a structured article.`
    });

    const generate = async () => {
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `Rewrite this text naturally.

Keep the original meaning and key ideas.
Keep similar length.
Avoid overly formal tone but keep grammar correct.

TEXT:
"${text}"`
          }]
        }],
        generationConfig: {
          temperature: 0.90,
          topP: 0.99, 
          maxOutputTokens: 1500,
        }
      });

      return result.response.text().trim();
    };

    // ✅ SINGLE OUTPUT
    let finalOutput = await generate();

    // remove unwanted prefixes
    finalOutput = finalOutput.replace(
      /^(Option \d+|Output|Result|Here's the rewrite):/gi,
      ""
    );

    // ✅ LIGHTWEIGHT CLEAN
    function cleanText(text) {
      return text
        .replace(/\b(\w+)\s+\1\b/gi, "$1")
        .replace(/(^|\.\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase())
        .replace(/\.\./g, ".")
        .replace(/\s{2,}/g, " ");
    }

    finalOutput = cleanText(finalOutput);

    return res.status(200).json({ output: finalOutput });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
