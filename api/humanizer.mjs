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
- Avoid overly casual filler words (like "honestly", "you know")
- Avoid generic language
- Use precise and specific wording, and include brief, meaningful detail where it improves clarity
- Avoid neutral tone; use slight variation and emphasis to keep the writing engaging and natural
- Occasionally vary sentence openings and avoid uniform phrasing patterns
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
          temperature: 0.89,
          topP: 0.98,
          maxOutputTokens: 1200, // ✅ FIXED
        }
      });

      const response = await result.response;
      const textOutput = response.text().trim();

      // ✅ CUT DETECTION
      if (
        !textOutput.endsWith('.') &&
        !textOutput.endsWith('!') &&
        !textOutput.endsWith('?')
      ) {
        throw new Error("Incomplete response");
      }

      return textOutput;
    };

    const generateWithRetry = async (retries = 2) => {
      try {
        return await generate();
      } catch (err) {
        console.warn("Retrying Gemini...", err.message);

        if (retries > 0) {
          await new Promise(r => setTimeout(r, 700));
          return generateWithRetry(retries - 1);
        }

        throw err;
      }
    };

    let outputs = [];

    outputs.push(await generateWithRetry());

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
        .replace(/\b(\w+)\s+\1\b/gi, "$1")
        .replace(/\bmany that\b/gi, "a lot of that")
        .replace(/\bmany that repetitive\b/gi, "a lot of that repetitive")
        .replace(/\bthere's many\b/gi, "there is a lot of")
        .replace(/\bthere’s many\b/gi, "there is a lot of")
        .replace(/\bacross much every\b/gi, "across almost every")
        .replace(/(^|\.\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase())
        .replace(/\bThis\.\s*This\b/gi, "This")
        .replace(/\bThis and\b/gi, "This, and")
        .replace(/\bcreates many transparency\b/gi, "creates greater transparency")
        .replace(/\bsince of that\b/gi, "because of that")
        .replace(/\bgo way up\b/gi, "increase significantly")
        .replace(/\bpretty\b/gi, "")
        .replace(/\bhuge\b/gi, "significant")
        .replace(/\bmassive\b/gi, "substantial")
        .replace(/\bthere's\b/gi, "there is")
        .replace(/\byou've got\b/gi, "there are")
        .replace(/,\s*\./g, ".")
        .replace(/\.\./g, ".")
        .replace(/\s{2,}/g, " ");
    }

    finalOutput = breakStructure(finalOutput);
    finalOutput = cleanText(finalOutput);

    return res.status(200).json({ output: finalOutput });

  } catch (error) {
    console.error("FULL ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
