import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "No text provided" });
    }

    const systemInstruction = `Rewrite the text as a professional explaining dense data to a colleague in a friendly, clear way.

CORE RULES:
- Keep the original core meaning, exact stats, data metrics, and technical terms intact.
- Do NOT stack facts back-to-back in a tight, dense line.
- Never stack abstract academic nouns back-to-back.
- Space facts out with natural analytical transitions (e.g., "If you look at 2024, the numbers actually jumped by about 45%").
- Keep overall length similar; do not increase by more than 30 words.
- Maintain an academic tone but vary sentence lengths for natural human flow.

STYLE GUIDELINES:
- Grammar must be accurate, but avoid pristine textbook symmetry.
- Avoid predictable structure and overly formal tone.
- Add natural variation: mix short sentences (<10 words) and long sentences (>25 words).
- Occasionally use conversational markers like "actually," "basically," or "if you look at…".
- Vary how data is written: mix "percent" with "%", and numbers as words vs digits.
- Avoid slick corporate copy; it should read like a fresh, unedited first-draft thought.
- Stop immediately when done. Never include a tidy wrap-up sentence at the end.`;

    // Use currently available models
    const models = ["gpt-4o-mini", "gpt-4.1-mini"];

    const generateFromModel = async (modelName: string) => {
      const response = await openai.chat.completions.create({
        model: modelName,
        temperature: 0.82,
        top_p: 0.85,
        max_tokens: Math.ceil(text.split(" ").length * 1.4), // avoid truncation
        messages: [
          { role: "system", content: systemInstruction },
          {
            role: "user",
            content: `Completely reconstruct this text. Separate dense clusters of facts so they flow like an organic human train of thought. Break polished, machine-like sentence structures. Do not include labels.

TEXT:
${text}`,
          },
        ],
      });

      const textOutput = response.choices[0]?.message?.content?.trim();

      if (!textOutput) {
        throw new Error("Empty response");
      }

      return textOutput;
    };

    const generateWithFallback = async () => {
      for (const model of models) {
        try {
          return await generateFromModel(model);
        } catch (err: any) {
          console.warn(`Model ${model} failed:`, err.message);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
      throw new Error("All models failed");
    };

    let finalOutput = await generateWithFallback();

    finalOutput = finalOutput.replace(
      /^(Option \d+|Output|Result|Here's the rewrite|Rewritten text):/gi,
      ""
    );

    function cleanText(t: string) {
      return t
        .replace(/\s{2,}/g, " ")
        .replace(/,\s*\./g, ".")
        .replace(/\.\./g, ".")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    }

    finalOutput = cleanText(finalOutput);

    return res.status(200).json({ output: finalOutput });
  } catch (error: any) {
    console.error("FULL ERROR:", error);
    return res.status(500).json({ error: error.message || "Unknown error" });
  }
}
