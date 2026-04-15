import { GoogleGenerativeAI } from "@google/generative-ai"; 

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

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
- Keep grammar mostly correct, but avoid obvious grammatical errors
- Ensure sentences are logically clear, while keeping the flow slightly uneven and natural
- Mix short and long sentences
- Avoid perfect structure
- Avoid predictable structure
- Allow slight jumps in ideas, but keep sentences understandable
- Use simple, clear language instead of technical jargon
- Avoid overly formal tone, but maintain clear and professional wording
- Avoid overly casual filler words (like "honestly", "you know")
- Do not maintain perfectly consistent reasoning flow; allow small shifts or slight repetition in ideas
- Avoid clean paragraph-level flow; let sentences feel slightly disconnected across the paragraph

IMPORTANT:
The text should NOT feel like a structured article.
It should feel like someone explaining things in a natural, slightly uneven way.`
    });

    const generate = async () => {
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `Rewrite this text naturally.

Keep the original meaning and key ideas, but allow natural rewording.
Keep similar length.
Do NOT follow a perfect introduction → explanation → conclusion structure.
Avoid overly casual filler words, but do not make it sound like a formal essay.

TEXT:
"${text}"`
          }]
        }],
        generationConfig: {
          temperature: 0.91,
          topP: 0.98,
          maxOutputTokens: 3000,
        }
      });

      return (await result.response).text().trim();
    };

    let outputs = await Promise.all([
      generate(),
      generate(),
      generate()
    ]);

    function humanScore(text) {
      let score = 0;

      if (text.match(/\./g)?.length > 5) score += 1;
      if (/(this|these).{0,20}\1/i.test(text)) score += 1;
      if (text.includes("But ") || text.includes("And ")) score += 1;
      if (!text.includes("Furthermore") && !text.includes("Moreover")) score += 1;
      if (text.split(". ").some(s => s.length < 40)) score += 1;

      return score;
    }

    let finalOutput = outputs.sort((a, b) => humanScore(b) - humanScore(a))[0];

    finalOutput = finalOutput.replace(
      /^(Option \d+|Output|Result|Here's the rewrite):/gi,
      ""
    );

    // 🔥 SAFE STRUCTURE BREAK (minimal)
    function breakStructure(text) {
      return text
        .replace(/\n\n/g, (m) => (Math.random() > 0.6 ? " " : m))
        .replace(/\. ([A-Z])/g, (m, p1) =>
          Math.random() > 0.85 ? `. ${p1}` : m
        );
    }

    // 🔥 COMPACT CLEANER (safe + focused)
    function cleanText(text) {
      return text
        // duplicates
        .replace(/\b(\w+)\s+\1\b/gi, "$1")

        // broken joins
        .replace(/\bThis\.\s*This\b/gi, "This")
        .replace(/\bThis and\b/gi, "This, and")

        // grammar fixes
        .replace(/\bcreates many transparency\b/gi, "creates greater transparency")
        .replace(/\bsince of that\b/gi, "because of that")
        .replace(/\bgo way up\b/gi, "increase significantly")

        // tone control (light)
        .replace(/\bpretty\b/gi, "")
        .replace(/\ba lot of\b/gi, "many")
        .replace(/\bhuge\b/gi, "significant")
        .replace(/\bmassive\b/gi, "substantial")

        // contractions
        .replace(/\bthere's\b/gi, "there is")
        .replace(/\byou've got\b/gi, "there are")

        // punctuation fixes
        .replace(/,\s*\./g, ".")
        .replace(/\.\./g, ".")

        // spacing
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
