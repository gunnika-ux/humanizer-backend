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
- Keep tone semi-professional (avoid slang like "honestly", "you know", "pretty cool")
- Use clear but not overly formal wording

IMPORTANT:
The text should NOT feel like a structured article.
It should feel like someone explaining things in a natural, slightly uneven way, but still suitable for a university assignment.`
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
Avoid overly casual phrases, but do not make it sound like a formal essay.

TEXT:
"${text}"`
          }]
        }],
        generationConfig: {
          temperature: 0.86,
          topP: 0.99,
          maxOutputTokens: 3000,
        }
      });

      return (await result.response).text().trim();
    };

    let output1 = await generate();
    let output2 = await generate();

    let finalOutput =
      output1.length > output2.length ? output1 : output2;

    finalOutput = finalOutput.replace(
      /^(Option \d+|Output|Result|Here's the rewrite):/gi,
      ""
    );

    // 🔥 STRUCTURE BREAK (unchanged)
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
