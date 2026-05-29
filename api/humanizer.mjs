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

    // THE ABSOLUTE SOLUTION: Forces the AI to ruin its own "perfect writing" patterns
    const systemInstruction = `Rewrite the text like a real person casually explaining complex ideas to a colleague.

CRITICAL:
- Keep the original meaning, exact facts, stats, numbers, names, and technical terms completely intact. Do not delete them.
- Do NOT summarize.
- Keep a similar overall length.

STYLE & STRUCTURE:
- Keep basic grammar correct, but aggressively avoid pristine, mathematically balanced sentence structures.
- Shatter uniform rhythm: explicitly place an incredibly short, blunt phrase (3-5 words) right next to a long, winding explanation.
- Intentionally break up academic terms by framing them loosely (e.g., instead of "The paper utilized a quantitative MANOVA framework," write "The study looked at the data using a MANOVA setup").
- Inject human structural messiness: use em-dashes, parenthetical side notes, or mid-thought colons to force a non-linear flow.
- Avoid clean paragraph transitions and flat, sterile delivery. The writing must feel spontaneous, direct, and slightly unpolished.
- Never use repetitive transitional formulas or predictable sentence openings. 
- End abruptly and naturally without any summary-style closing remarks.

IMPORTANT:
The text must NOT look like a structured article or an edited textbook. It needs to read like a raw, direct, slightly uneven thought.`;

    // FIXED: gpt-5.4-mini is now primary to leverage its superior instruction following
    const models = [
      "gpt-5.4-mini",
      "gpt-5-mini"
    ];

    const generateFromModel = async (modelName) => {
      const response = await openai.chat.completions.create({
        model: modelName,
        // FIXED: Shifted parameters to give the engine word-choice freedom to break AI patterns
        temperature: 0.92,
        top_p: 0.95,
        messages: [
          { role: "system", content: systemInstruction },
          { 
            role: "user", 
            content: `Completely rewrite this text. Keep every single hard fact, dataset, and technical name, but fundamentally destroy the polished, predictable sentence paths. Make the phrasing rhythm uneven and deeply human. Do not include labels.

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
        .replace(/\b(\w+)\s+\1\b/gi, "$1") // Clear double words
        .replace(/\s{2,}/g, " ")           // Clear double spacing
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
