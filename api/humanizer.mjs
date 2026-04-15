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
      systemInstruction: `Rewrite the text like a real human.

CRITICAL:
- Keep meaning exactly the same
- Keep grammar correct
- Do NOT summarize
- Keep similar length

STYLE:
- Mix short and long sentences naturally
- Avoid repeating sentence structure
- Keep tone professional but slightly conversational
- Allow minor variation in flow (not perfectly smooth)

IMPORTANT:
The output should feel like natural human writing, not an optimized article.`
    });

    // 🔹 Generate twice and pick better (reduces detection spikes)
    const generate = async () => {
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `Rewrite this text naturally:

"${text}"`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.92,
          maxOutputTokens: 3000,
        }
      });

      return (await result.response).text().trim();
    };

    let output1 = await generate();
    let output2 = await generate();

    // 🔹 Simple selection: pick longer + more varied one
    let finalOutput =
      output2.length > output1.length ? output2 : output1;

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
