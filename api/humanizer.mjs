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

    const systemInstruction = `You are a student rewriting your own research notes. Talk like a real person explaining a paper's findings directly to a classmate.

CRITICAL:
- Keep every single specific fact, date, percentage, stat, method name (like MANOVA), and university name exactly as they are. Do not alter or omit them.
- Do NOT summarize the text; rewrite it completely.
- Keep a similar total length.

STYLE & STRUCTURE PARAMETERS:
- Break the AI signature by using an irregular, conversational cadence.
- Mix sentence lengths aggressively: place an incredibly short sentence (3-6 words) right next to a long, explanatory one.
- Never use back-to-back sentences that share the same grammatical blueprint or length.
- Avoid pristine, mathematically balanced phrasing. Let the transitions feel slightly uneven, direct, and raw.
- Use natural human punctuation: drop mid-sentence colons, em-dashes, or brief parenthetical notes to shatter predictable sentence flow.
- Keep all grammar and academic spelling perfectly accurate, but drop the clinical "textbook" gloss.
- Do not add any summary-style closing thoughts or robotic wrapping sentences at the end.`;

    const models = [
      "gpt-5-mini",
      "gpt-5.4-mini"
    ];

    const generateFromModel = async (modelName) => {
      const response = await openai.chat.completions.create({
        model: modelName,
        // Restored your requested parameters and stripped out all penalties
        temperature: 0.9,
        top_p: 0.95,
        messages: [
          { role: "system", content: systemInstruction },
          { 
            role: "user", 
            content: `Completely change the sentence structure, word sequence, and overall flow of this text. Keep the exact facts and core data, but make the rhythm deeply human, unpredictable, and uneven. Do not include introductory notes or labels.

TEXT TO REWRITE:
${text}` 
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
      /^(Option \d+|Output|Result|Here's the rewrite|Rewritten text):/gi,
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
