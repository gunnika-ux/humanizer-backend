import { GoogleGenerativeAI } from "@google/generative-ai"; 

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  // 🔐 AUTH CHECK (only addition)
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
      systemInstruction: `Rewrite the text like a real university student explaining ideas clearly.

CRITICAL:
- Keep the original meaning and key ideas
- Do NOT summarize
- Keep similar length

STYLE:
- Keep grammar correct and natural (no obvious mistakes)
- Avoid overly formal or academic tone
- Avoid generic AI-style phrasing and textbook language
- Avoid technical jargon unless necessary; simplify where possible
- Use clear, natural wording instead of complex or abstract phrases

HUMANIZATION:
- Mix short and long sentences naturally
- Allow slight uneven flow, but keep sentences understandable
- Occasionally include mild emphasis or clarification (e.g., "you can see this", "in practice")
- Avoid perfect structure and predictable phrasing patterns
- Do not make every sentence flow perfectly; allow small shifts in rhythm

IMPORTANT:
- The writing should feel like a thoughtful explanation, not a formal essay
- It should sound natural, slightly varied, and realistic
- Avoid sounding too polished, robotic, or overly structured`
    });

    const generate = async () => {
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `Rewrite this text naturally.

Keep the meaning the same and maintain similar length.
Do NOT make it sound like a formal essay or textbook.
Avoid technical jargon and overly complex phrasing.
Use clear, natural wording with slight variation in sentence structure.

TEXT:
"${text}"`
          }]
        }],
        generationConfig: {
          temperature: 0.88,
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

    function breakStructure(text) {
      return text
        .replace(/\n\n/g, (m) => (Math.random() > 0.6 ? " " : m))
        .replace(/\. ([A-Z])/g, (m, p1) =>
          Math.random() > 0.85 ? `. ${p1}` : m
        );
    }

    function cleanText(text) {
      return text
        // duplicates
        .replace(/\b(\w+)\s+\1\b/gi, "$1")

        // grammar improvements
        .replace(/\bmany that\b/gi, "a lot of that")
        .replace(/\bmany that repetitive\b/gi, "a lot of that repetitive")
        .replace(/\bthere's many\b/gi, "there is a lot of")
        .replace(/\bthere’s many\b/gi, "there is a lot of")
        .replace(/\bacross much every\b/gi, "across almost every")

        // capitalization fix
        .replace(/(^|\.\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase())

        // broken joins
        .replace(/\bThis\.\s*This\b/gi, "This")
        .replace(/\bThis and\b/gi, "This, and")

        // grammar fixes
        .replace(/\bcreates many transparency\b/gi, "creates greater transparency")
        .replace(/\bsince of that\b/gi, "because of that")
        .replace(/\bgo way up\b/gi, "increase significantly")

        // tone balance
        .replace(/\bpretty\b/gi, "")
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
