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

    // FIXED TARGET LINE: Tells the AI to write like an expert dictating thoughts out loud. Clean, professional vocabulary but zero textbook symmetry.
    const systemInstruction = `Rewrite the text to mimic the natural, unedited phrasing of a professional dictating thoughts out loud. Use advanced vocabulary, but completely avoid stiff textbook symmetry and casual slang.`;

CRITICAL FACT HANDLING:
- Keep the original core meaning, exact stats, data metrics, and technical terms intact.
- Do NOT stack facts back-to-back in a tight, dense line. 
- Space the facts out across different clauses. Do NOT use long filler phrases or fluff transitions to do this. Instead, break dense rows of facts apart by ending a sentence early or using punctuation mid-thought.
- Do NOT summarize. Ideally, keep the overall length close to the original text, naturally aiming not to increase the word count by more than roughly 20 to 30 words total.
- Remove Predictable structure
STYLE & ANTI-DETECTION RUNTIME:
- Keep grammar accurate, but completely abandon pristine, textbook symmetry.
- Attack sentence length uniformity: intentionally use a tiny 2-4 word sentence right before or after a long, descriptive phrase.
- Introduce natural structural variations: use a colon mid-sentence or a sudden period to stagger the text flow.
- Vary how data is written to look human (e.g., mix writing out "percent" with "%", or numbers as words versus digits).
- Avoid predictable, flat academic patterns or slick corporate copy. It must read like a fresh, unedited, first-draft thought.
- Stop immediately when done. Never include a tidy wrap-up sentence at the end.`;

    const models = [
      "gpt-5-mini",
      "gpt-5.4-mini"
    ];

    const generateFromModel = async (modelName) => {
      const response = await openai.chat.completions.create({
        model: modelName,
        // STABILIZED TEMPERATURE: 0.90 keeps the phrasing highly unpredictable without breaking grammar
        temperature: 0.90,
        top_p: 0.99,
        messages: [
          { role: "system", content: systemInstruction },
          { 
            role: "user", 
            content: `Completely reconstruct this text. Separate the dense clusters of facts by altering the sentence blueprints so they flow like an organic human train of thought. Try to keep the final output length comfortable, ideally adding no more than 20 to 30 extra words over the original size. Do not include labels.

TEXT:
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
