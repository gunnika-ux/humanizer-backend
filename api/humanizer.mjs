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

    // RE-ENGINEERED PROMPT: Controls word count bloat while keeping the low AI signature
    const systemInstruction = `Rewrite the text like a professional casually breaking down data for a colleague over a direct chat message.

CRITICAL FACT & LENGTH CONTROL:
- Keep the original core meaning, exact stats, data metrics, and technical terms completely intact.
- STRICT LENGTH BUDGET: Keep the total word count close to the original text. Do not pad with unnecessary words, long explanations, or fluff. 
- Instead of adding extra words to separate facts, use punctuation shifts (like parentheses or commas) to break up dense data blocks.
- Do NOT summarize.

STYLE & ANTI-DETECTION RUNTIME:
- Keep grammar accurate, but completely drop pristine, textbook-style symmetry.
- Vary sentence structures aggressively: place a tiny 2-4 word sentence right before or after a longer clause.
- Introduce natural, human structural variations: use regular commas, colons mid-thought, or natural parentheses (like this) for quick aside notes to stagger the text flow.
- Avoid predictable academic patterns or slick corporate copy. Write with a direct, unedited, first-draft momentum.
- Stop immediately when done. Never include a tidy wrap-up sentence at the end.`;

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
            content: `Completely change the sentence structures and layout of this text. Keep the word count tight and close to the original text, but make the rhythm uneven, distinct, and human. Do not include labels or intros.

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

    // CLEANUP SYSTEM: Vaporizes brackets and dash artifacts automatically
    function cleanText(input) {
      if (!input) return "";

      return input
        // 1. Clears any lingering robotic bracket leakages
        .replace(/[\[\{\s]*which\s+matters[\s\]\}\.\,]*(-*\s*)*/gi, " ")
        
        // 2. Converts any accidental em-dashes or double-hyphens into clean, normal commas
        .replace(/\s*[—–——]\s*/g, ", ")
        .replace(/\s+-\s+/g, ", ")
        .replace(/-{2,}/g, ", ")
        
        // 3. String normalization
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
