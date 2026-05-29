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

    // CLEANED UNIVERSAL PROMPT: Removes conflicting traps so the engine actually drops the AI score
    const systemInstruction = `Rewrite the text like a real person explaining ideas.

CRITICAL:
- Keep the original meaning, exact facts, stats, numbers, and proper nouns completely intact.
- Do NOT summarize.
- Keep a similar overall length.

STYLE:
- Keep grammar correct.
- Break the AI signature by using an irregular, conversational cadence.
- Mix sentence lengths aggressively: place an incredibly short sentence (3-6 words) right next to a long, explanatory one.
- Never use back-to-back sentences that share the exact same grammatical structure or rhythm.
- Avoid pristine, mathematically balanced phrasing or clean textbook-style flow. Let transitions feel slightly raw and direct.
- Inject human punctuation patterns: naturally drop em-dashes, parenthetical asides, or mid-thought colons to shatter uniform sentence streams.
- Ensure sentences are logically understandable, but allow the phrasing to feel spontaneous rather than heavily engineered or over-polished.
- End naturally without adding a summary-style closing line.`;

    // CHANGED: Prioritizing the more advanced 5.4 engine to handle complex articles gracefully
    const models = [
      "gpt-5.4-mini",
      "gpt-5-mini"
    ];

    const generateFromModel = async (modelName) => {
      const response = await openai.chat.completions.create({
        model: modelName,
        // FIXED: Higher temperature and unrestricted top_p forces unpredictable, low-AI-score choices
        temperature: 0.93,
        messages: [
          { role: "system", content: systemInstruction },
          { 
            role: "user", 
            content: `Completely change the sentence structure, word sequence, and overall flow of this text. Keep the exact facts and core data completely intact, but make the rhythm deeply human, unpredictable, and uneven. Do not include introductory notes or labels.

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

    // Strip out common AI prefix tags if they appear
    finalOutput = finalOutput.replace(
      /^(Option \d+|Output|Result|Here's the rewrite|Rewritten text):/gi,
      ""
    );

    function cleanText(text) {
      return text
        .replace(/\b(\w+)\s+\1\b/gi, "$1") // Clean duplicate words
        .replace(/\s{2,}/g, " ")           // Clean double spacing
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
