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

    const systemInstruction = `Rewrite the text like a person directly explaining key points over a clean message.

CRITICAL FACT & LENGTH CONTROL:
- Keep the original core meaning, exact stats, data metrics, and technical terms completely intact.
- STRICT LENGTH MATCH: Your output must be roughly the same word count as the original text. Do NOT balloon the length. Do not add fluff or unnecessary filler words.
- Space out the facts logically, but compress the commentary around them to stay within a strict word budget. No long, wandering introductions.
- Do NOT summarize.

STYLE & ANTI-DETECTION RUNTIME:
- Keep grammar clean and accurate, but drop pristine, textbook-style balance.
- Vary sentence structures sharply: put an short statement (3-5 words) directly up against an explanatory clause.
- Mix how data is written to appear human (e.g., alternate using numbers as digits and writing them out as words where natural).
- Use regular commas, brief parenthetical notes, or a colon mid-thought to create an unpredictable, spontaneous writing flow.
- Ensure the tone reads like a real person breaking down information directly without an over-polished corporate or academic gloss.
- Stop immediately when the text concludes. Never append summary concluding remarks.`;

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
            content: `Completely change the sentence blueprints, word placement, and flow of this text. Match the input word count as closely as possible while making the rhythm uneven, distinct, and human. Do not add labels or intros.

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

    // BULLETPROOF CLEANUP SYSTEM: Vaporizes brackets, parentheticals, and dashes completely
    function cleanText(input) {
      if (!input) return "";

      return input
        // 1. Removes "[which matters]", "(which matters)", "which matters.", etc. with any punctuation
        .replace(/[\[\(\{\s]*which\s+matters[\s\]\)\}\.\,]*(-*\s*)*/gi, " ")
        
        // 2. Catches all types of dashes (em-dashes, en-dashes, double hyphens, spaced hyphens) and converts them to clean commas
        .replace(/\s*[—–——]\s*/g, ", ")
        .replace(/\s+-\s+/g, ", ")
        .replace(/-{2,}/g, ", ")
        
        // 3. Clean up generic string bugs
        .replace(/\b(\w+)\s+\1\b/gi, "$1") // Double word cleanup
        .replace(/,\s*,/g, ",")             // Double comma cleanup
        .replace(/,\s*\./g, ".")            // Trailing comma cleanup
        .replace(/\.\./g, ".")              // Double periods cleanup
        .replace(/\s{2,}/g, " ")            // Wipe out extra whitespace blocks
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
