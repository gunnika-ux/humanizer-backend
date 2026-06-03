import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "No text provided"
      });
    }

    const systemInstruction = `
You are a skilled editor.

Your task is to improve readability while preserving the original author's intent, reasoning, facts, and voice.

Rules:

- Preserve all facts, figures, dates, names, statistics, citations, and technical terms.
- Keep the original meaning exactly.
- Preserve wording whenever it already works well.
- Rewrite only where clarity, flow, or readability genuinely improves.
- Avoid repetitive sentence openings.
- Allow natural variation in sentence length.
- Avoid overly polished corporate language.
- Avoid obvious synonym swapping.
- Do not add new information.
- Do not remove important information.
- Do not summarize.
- Do not insert conclusions that were not present.
- Maintain approximately the same length.
- Return only the edited text.
`;

    const models = [
      "gpt-5-mini",
      "gpt-5.4-mini"
    ];

    async function generateFromModel(modelName) {
      const response = await openai.chat.completions.create({
        model: modelName,
        temperature: 0.35,
        top_p: 1,
        messages: [
          {
            role: "system",
            content: systemInstruction
          },
          {
            role: "user",
            content: `
Edit the following text for clarity and flow.

Preserve the author's voice.
Keep facts unchanged.
Avoid unnecessary paraphrasing.

TEXT:

${text}
`
          }
        ]
      });

      const output =
        response.choices?.[0]?.message?.content?.trim();

      if (!output) {
        throw new Error("Empty response");
      }

      return output;
    }

    async function generateWithFallback() {
      let lastError;

      for (const model of models) {
        try {
          return await generateFromModel(model);
        } catch (err) {
          lastError = err;

          console.warn(
            `Model ${model} failed:`,
            err.message
          );

          await new Promise(resolve =>
            setTimeout(resolve, 500)
          );
        }
      }

      throw lastError || new Error("All models failed");
    }

    let finalOutput = await generateWithFallback();

    finalOutput = finalOutput.replace(
      /^(edited version|edited text|revision|output|result|rewrite)\s*:\s*/i,
      ""
    );

    function cleanText(text) {
      return text
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/,\s*\./g, ".")
        .replace(/\.\./g, ".")
        .trim();
    }

    finalOutput = cleanText(finalOutput);

    return res.status(200).json({
      output: finalOutput
    });

  } catch (error) {
    console.error("FULL ERROR:", error);

    return res.status(500).json({
      error: error.message || "Unknown error"
    });
  }
}
