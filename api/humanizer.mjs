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
- Keep grammar mostly correct
- Mix short and long sentences
- Avoid perfect structure
- Allow slight jumps in ideas
- Avoid textbook flow
- Use natural phrasing
- Avoid predictable structure
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
          temperature: 0.89,
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
        .replace(/\n\n/g, (m) => (Math.random() > 0.5 ? " " : m))
        .replace(/\. ([A-Z])/g, (m, p1) =>
          Math.random() > 0.5 ? `. ${p1}` : m
        )
        .replace(/, /g, (m) =>
          Math.random() > 0.85 ? ", which " : m
        )
        .replace(/because/g, (m) =>
          Math.random() > 0.7 ? "since" : m
        )
        .replace(/ and /g, (m) =>
          Math.random() > 0.7 ? " & " : m
        );
    }

    // 🔥 GRAMMAR FIX
    function fixGrammar(text) {
      return text
        .replace(/\b(\w+)\s+\1\b/gi, "$1")
        .replace(/\bwhich which\b/gi, "which")
        .replace(/\bwhich you get\b/gi, "which gives you")
        .replace(/\bwhich you can\b/gi, "which allows you")
        .replace(/\bnow,\s*which\b/gi, "Now,")
        .replace(/\bwhich but\b/gi, "but")
        .replace(/,\s*which\s+/gi, ". This ")
        .replace(/\.\s*which\s+/gi, ". This ")
        .replace(/\bthere's\b/gi, "there is")
        .replace(/\byou've got\b/gi, "there are")
        .replace(/\s{2,}/g, " ");
    }

    // 🔥 CLARITY FIX
    function refineClarity(text) {
      return text
        .replace(/\bincreasing much higher\b/gi, "significantly higher")
        .replace(/\ba big deal for\b/gi, "important for")
        .replace(/\bpretty high\b/gi, "relatively high")
        .replace(/\bThis gives you\b/gi, "This provides")
        .replace(/\bThis lets\b/gi, "This allows")
        .replace(/\bBecause of that,\s*/gi, "")
        .replace(/\bIn the end,\s*/gi, "")
        .replace(/;\s*/g, ". ")
        .replace(/\s{2,}/g, " ");
    }

    // 🔥 LIGHT PROFESSIONAL POLISH
    function lightPolish(text) {
      return text
        .replace(/\bpretty huge deal\b/gi, "a significant step")
        .replace(/\bbiggest thing\b/gi, "a critical priority")
        .replace(/\bbasically\b/gi, "")
        .replace(/\bwe're seeing\b/gi, "there is increasing")
        .replace(/\bhooked up\b/gi, "integrated")
        .replace(/\bcan't\b/gi, "cannot")
        .replace(/\bdoesn't\b/gi, "does not")
        .replace(/\bmoney-related\b/gi, "financial")
        .replace(/\bcosts a ton of money\b/gi, "requires substantial investment")
        .replace(/\bmassive logistical mess\b/gi, "significant logistical challenge")
        .replace(/\bphysical stuff\b/gi, "infrastructure")
        .replace(/\bput their cash into\b/gi, "invest in")
        .replace(/\breally\b/gi, "")
        .replace(/\s{2,}/g, " ");
    }

    finalOutput = breakStructure(finalOutput);
    finalOutput = fixGrammar(finalOutput);
    finalOutput = refineClarity(finalOutput);
    finalOutput = lightPolish(finalOutput);

    return res.status(200).json({ output: finalOutput });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
