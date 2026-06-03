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

    if (!text?.trim()) {
      return res.status(400).json({
        error: "No text provided"
      });
    }

    const systemInstruction = `
You are an expert editor.

Your job is to revise text so it reads naturally, clearly, and smoothly.

Requirements:

- Preserve the original meaning.
- Preserve all facts, figures, dates, names, statistics, citations, and technical terminology.
- Keep the author's intent intact.
- Improve flow and readability.
- Reduce repetitive phrasing when it appears.
- Allow sentence lengths to vary naturally.
- Allow moderate restructuring when it improves clarity.
- Avoid robotic transitions.
- Avoid corporate or marketing-style language.
- Avoid unnecessary synonym replacement.
- Do not add new information.
- Do not remove important information.
- Do not summarize.
- Keep approximately the same length.
- Return only the edited text.
`;

    const models = [
      "gpt-5-mini",
      "gpt-5.4-mini"
    ];

    async function generateFromModel(modelName) {
      const response = await openai.chat.completions.create({
        model: modelName,
        temperature: 0.55,
        top_p: 0.95,
        messages: [
          {
            role: "system",
            content: systemInstruction
          },
          {
            role: "user",
            content: `
Revise the text below.

Focus on readability, flow, and natural phrasing.

Keep all factual content intact.

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

    finalOutput = finalOutput
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/,\s*\./g, ".")
      .replace(/\.\./g, ".")
      .trim();

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
