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
- Mix short and long sentences
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
- Occasionally add brief impact or consequence where it fits naturally
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
          temperature: 0.90, // 🔥 faster + stable
          topP: 0.98,
          maxOutputTokens: 1500, // 🔥 reduced for speed
        }
      });

      return result.response.text().trim();
    };

    // ✅ SINGLE OUTPUT
    let finalOutput = await generate();

    finalOutput = finalOutput.replace(
      /^(Option \d+|Output|Result|Here's the rewrite):/gi,
      ""
    );

    function breakStructure(text) {
      return text
        .replace(/\n\n/g, (m) => (Math.random() > 0.6 ? " " : m))
        .replace(/\. ([A-Z])/g, (m, p1) =>
          Math.random() > 0.85 ? `. ${p1}` : m
        );
    }

    function cleanText(text) {
      return text
        .replace(/\b(\w+)\s+\1\b/gi, "$1")
        .replace(/\bmany that\b/gi, "a lot of that")
        .replace(/\bthere's many\b/gi, "there is a lot of")
        .replace(/\bacross much every\b/gi, "across almost every")
        .replace(/(^|\.\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase())
        .replace(/\bThis\.\s*This\b/gi, "This")
        .replace(/\bsince of that\b/gi, "because of that")
        .replace(/,\s*\./g, ".")
        .replace(/\.\./g, ".")
        .replace(/\s{2,}/g, " ");
    }

    finalOutput = breakStructure(finalOutput);
    finalOutput = cleanText(finalOutput);

    return res.status(200).json({ output: finalOutput });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
