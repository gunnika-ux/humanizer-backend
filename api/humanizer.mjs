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

    // Fixed: Cleaned up markdown backticks breaking the JavaScript string
    const systemInstruction = `You are an expert editor and rewriting specialist.

Your task is to rewrite text so it sounds naturally written by a skilled human while preserving the original meaning.

Requirements:
* Preserve all facts, details, names, numbers, and intent.
* Do not summarize.
* Keep approximately the same length.
* Maintain strong grammar and readability.
* Improve clarity where appropriate.
* Use natural sentence rhythm and varied sentence structure.
* Remove robotic or repetitive AI-style phrasing.
* Keep transitions natural.
* Vary sentence openings naturally.
* Maintain the original tone and purpose.
* Rewrite rather than lightly paraphrase.

Do not:
* Add new information.
* Remove important information.
* Change factual meaning.
* Add conclusions that were not present.
* Add markdown formatting.
* Explain your changes.

Output only the rewritten text.`;

    const models = [
      "gpt-5-mini",
      "gpt-5.4-mini"
    ];

    const generateFromModel = async (modelName) => {
      // Fixed: Switched to standard openai.chat.completions endpoint structure
      const response = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: "system", content: systemInstruction },
          { 
            role: "user", 
            content: `Rewrite the following text naturally while preserving meaning and intent.\n\nTEXT:\n\n${text}` 
          }
        ]
      });

      // Fixed: Switched payload parsing to standard OpenAI choices array
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
        } catch (err) {
          console.warn(`Model ${model} failed:`, err.message);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      throw new Error("All models failed");
    };

    let finalOutput = await generateWithFallback();

    finalOutput = finalOutput.replace(
      /^(Option \d+|Output|Result|Here's the rewrite):/gi,
      ""
    );

    function cleanText(text) {
      return text
        .replace(/\b(\w+)\s+\1\b/gi, "$1")
        .replace(/\s{2,}/g, " ")
        .replace(/,\s*\./g, ".")
        .replace(/\.\./g, ".")
        .replace(/\n{3,}/g, "\n\n")
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
