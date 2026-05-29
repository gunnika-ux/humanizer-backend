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

    // UPDATED PROMPT: Targets deep structural variations to bypass AI tracking while maintaining zero factual loss
    const systemInstruction = `You are a world-class editor. Your goal is to completely rewrite the text so it matches the authentic, organic cadence of an expert human writer. You must bypass algorithmic patterns while delivering exceptional grammatical quality and flow.

CORE OBJECTIVES:
- Factual Preservation: Maintain 100% of the core meaning, ideas, facts, numbers, and precise intent. Do not summarize or cut major data.
- Radical Structural Variance: AI builds predictable, uniform sentence patterns. You must break this. Mix punchy, short clauses right next to complex, winding thoughts.
- Organic Flow: Use conversational, non-linear logic flow. Inject punctuation naturally (colons, dashes, or semicolons mid-thought) where grammatically appropriate to create a spontaneous human rhythm.
- Linguistic Shift: Do not perform a shallow paraphrase by replacing words with direct synonyms. Completely reorganize how the ideas are laid out and framed.
- Ban AI Signifiers: Absolutely eliminate structured transitions like "Furthermore," "Moreover," "Consequently," "In conclusion," "As a result," or "Ultimately." Use invisible transitions instead.
- Tone Maintenance: Keep the context professional, clear, and articulate. Do not add casual filler words like "honestly" or "you know." 

STRICT CONSTRAINTS:
- Do NOT add any external assumptions, commentary, or new information.
- Do NOT alter factual meanings.
- Do NOT output any markdown syntax, bolding (**), bullet points, or backticks.
- Do NOT explain your edits or provide an introduction/outro.
- Keep the overall length roughly similar by reallocating detail across newly shaped sentences.

Return ONLY the raw, humanized plain text.`;

    const models = [
      "gpt-5-mini",
      "gpt-5.4-mini"
    ];

    const generateFromModel = async (modelName) => {
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
