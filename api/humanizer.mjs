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
- Keep grammar mostly correct (small imperfections are okay)
- Mix short and long sentences
- Allow slight shifts in tone
- Avoid perfectly smooth or academic flow
- Use natural phrasing, not textbook wording
- Vary sentence openings naturally
- Avoid repeating patterns
- Avoid generic conclusion phrases like "Ultimately" or "Moving forward"
- Avoid generic policy-style phrasing (e.g., "it is important to", "we need to")
- Do not make every sentence logically connect smoothly; allow slight jumps in flow

IMPORTANT:
The text should feel naturally written, slightly imperfect, but still clear and readable.`
    });

    const generate = async () => {
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `Rewrite this text naturally.

Keep meaning same.
Keep similar length.
Do not make it sound like a perfect essay.

TEXT:
"${text}"`
          }]
        }],
        generationConfig: {
          temperature: 0.85,
          topP: 0.95,
          maxOutputTokens: 3000,
        }
      });

      return (await result.response).text().trim();
    };

    // 🔥 Generate twice (reduces bad outputs)
    let output1 = await generate();
    let output2 = await generate();

    // pick more "human-like" one (longer + less rigid)
    let finalOutput =
      output1.length > output2.length ? output1 : output2;

    finalOutput = finalOutput.replace(
      /^(Option \d+|Output|Result|Here's the rewrite):/gi,
      ""
    );

    return res.status(200).json({ output: finalOutput });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
