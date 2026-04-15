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
- Keep meaning exactly the same
- Do NOT summarize
- Keep similar length

STYLE:
- Keep grammar mostly correct
- Mix short and long sentences
- Avoid perfect structure
- Allow slight jumps in ideas
- Avoid textbook flow
- Use natural phrasing


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

Keep meaning same.
Keep similar length.
Do NOT follow a perfect introduction → explanation → conclusion structure.
Avoid overly casual filler words, but do not make it sound like a formal essay.

TEXT:
"${text}"`
          }]
        }],
        generationConfig: {
          temperature: 0.92,
          topP: 0.98,
          maxOutputTokens: 3000,
        }
      });

      return (await result.response).text().trim();
    };

    // 🔥 RUN IN PARALLEL (fix timeout)
    let outputs = await Promise.all([
      generate(),
      generate(),
      generate()
    ]);

    // 🔥 HUMAN SCORE
    function humanScore(text) {
      let score = 0;

      if (text.match(/\./g)?.length > 5) score += 1;

      if (text.includes("But ") || text.includes("And ")) score += 1;

      if (!text.includes("Furthermore") && !text.includes("Moreover")) score += 1;

      return score;
    }

    let finalOutput = outputs.sort((a, b) => humanScore(b) - humanScore(a))[0];

    finalOutput = finalOutput.replace(
      /^(Option \d+|Output|Result|Here's the rewrite):/gi,
      ""
    );

    // 🔥 STRUCTURE BREAK
    function breakStructure(text) {
      return text
        .replace(/\n\n/g, (m) => (Math.random() > 0.5 ? " " : m))
        .replace(/\. ([A-Z])/g, (m, p1) =>
          Math.random() > 0.7 ? `. ${p1}` : m
        );
    }

    finalOutput = breakStructure(finalOutput);

    return res.status(200).json({ output: finalOutput });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
