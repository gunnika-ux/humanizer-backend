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

    // PERFECTLY BALANCED PROMPT: Uses your 10-20 word buffer to break the 100% AI score
    const systemInstruction = `Rewrite the text like a professional casually explaining data points to a colleague over a direct message thread.

CRITICAL FACT & BUDGET CONTROL:
- Keep the original core meaning, exact statistics, numbers, dates, and technical names completely intact.
- LENGTH RULES: Keep the text tight and close to the original length, but you are allowed a very slight buffer of an extra 10 to 20 words. 
- Use this tiny word buffer exclusively to insert casual human phrasing and punctuation shifts around the heavy facts so they don't look bunched together.
- Do NOT summarize.

STYLE & ANTI-DETECTION:
- Keep grammar clean, but aggressively avoid over-polished, perfectly balanced textbook phrasing.
- Intentionally vary sentence lengths: place a tiny statement (3-5 words) right next to a longer, detailed sentence.
- Use conversational, non-linear phrasing structures. Introduce regular commas, brief parenthetical asides (like this), or a colon mid-thought to make the rhythm feel spontaneous.
- Never use uniform sentence openings, repetitive transitional words, or textbook formulas.
- Stop writing immediately once the message is delivered. Do not add a tidy wrap-up sentence or conclusion at the end.`;

    const models = [
      "gpt-5.4-mini",
      "gpt-5-mini"
    ];

    const generateFromModel = async (modelName) => {
      const response = await openai.chat.completions.create({
        model: modelName,
        temperature: 0.95,
        top_p: 0.95,
        messages: [
          { role: "system", content: systemInstruction },
          { 
            role: "user", 
            content: `Completely change the sentence structure, word sequence, and overall flow of this text. Keep the exact facts completely intact, but make the rhythm uneven, distinct, and human. Do not include labels or intro notes.

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

    // CLEANUP SYSTEM: Vaporizes brackets, dashes, and duplicate spaces cleanly
    function cleanText(input) {
      if (!input) return "";

      return input
        // 1. Clears any accidental bracket or parenthesis leakages of the "which matters" phrase
        .replace(/[\[\(\{\s]*which\s+matters[\s\]\)\}\.\,]*(-*\s*)*/gi, " ")
        
        // 2. Converts any accidental em-dashes, en-dashes, or double-hyphens into clean commas
        .replace(/\s*[—–——]\s*/g, ", ")
        .replace(/\s+-\s+/g, ", ")
        .replace(/-{2,}/g, ", ")
        
        // 3. General format normalization
        .replace(/\b(\w+)\s+\1\b/gi, "$1") // Clean duplicate words
        .replace(/,\s*,/g, ",")             // Clean double commas
        .replace(/,\s*\./g, ".")            // Clean trailing commas
        .replace(/\.\./g, ".")              // Clean double periods
        .replace(/\s{2,}/g, " ")            // Clean double spacing
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
