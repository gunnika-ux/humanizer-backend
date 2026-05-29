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

    // UPDATED PROMPT: Erases the clinical, academic textbook tone and forces raw, conversational phrasing.
    const systemInstruction = `You are a casual human writer rewriting a draft. Your goal is to explain the provided text completely naturally, as if you were explaining it to a friend or sending a quick, clear Slack message to a coworker. You must completely strip away any academic, formal, or textbook phrasing.

RULES FOR UN-FORMALIZING:
- Conversational Clarity: Write exactly how a real person talks when they know what they are talking about. Avoid stuffy, over-polished prose. Make it grounded and highly direct.
- Kill the Jargon: Take any dense technical terms, complex jargon, or abstract phrases and explain them using simple, everyday words. Do not sound like a manual or an essay.
- Imperfect Cadence: AI writes back-to-back sentences of the same length. You must avoid this. Write a short, blunt sentence. Follow it with a longer one. Use punctuation like dashes (—) or colons to connect loose thoughts naturally.
- No "AI Words": Never use transitions like "Furthermore," "Moreover," "Consequently," "Ultimately," "As a result," "Essentially," or "It is important to consider." Use simple words like "So," "But," "Mainly," or just start the next sentence with no transition word at all.
- Zero Fluff: Do not write a neat introduction sentence or a summarizing conclusion line. Start directly with the core message and end it when the points are made.

STRICT BOUNDARIES:
- Keep 100% of the facts, numbers, ideas, and core meaning intact. Do not lose any information.
- Do NOT add external commentary, summaries, introductions, or warnings.
- Do NOT output markdown symbols like asterisks (**), bullet points, or backticks.
- Keep the overall length roughly equivalent to the original text.

Return ONLY the raw, rewritten text.`;

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
