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

    // THE BALANCED BLUEPRINT: Spaces out facts to kill the 100% score, but caps total length growth
    const systemInstruction = `Rewrite the text like an expert communicating ideas naturally and directly over a message thread.

CRITICAL FACT & STRUCTURE CONTROL:
- Keep the original core meaning, exact statistics, numbers, dates, and technical names completely intact.
- Do NOT bunch facts together in tight, heavy clusters. Spread them out across the sentences.
- Allow the text to expand slightly to frame data points naturally, but do not add completely irrelevant filler words or repetitive thoughts.
- Do NOT summarize the content.

STYLE & ANTI-DETECTION:
- Keep grammar clean and accurate, but deliberately avoid over-polished, perfectly symmetrical textbook phrasing.
- Intentionally vary sentence lengths: place a very short statement (3-5 words) right next to a longer, detailed sentence.
- Use conversational, non-linear phrasing structures. Drop in normal commas, brief descriptive parentheticals, or a colon mid-thought to make the rhythm feel spontaneous.
- Never use uniform sentence openings or repetitive transitional phrases.
- Stop writing immediately once the message is delivered. Do not add a tidy wrap-up sentence or conclusion at the end.`;

    const models = [
      "gpt-5.4-mini",
      "gpt-5-mini"
    ];

    const generateFromModel = async (modelName) => {
      const response = await openai.chat.completions.create({
        model: modelName,
        // Kept high to maximize vocabulary variance and drop predictability scores
        temperature: 0.95,
        top_p: 0.95,
        messages: [
          { role: "system", content: systemInstruction },
          { 
            role: "user", 
            content: `Completely change the sentence structure, word sequence, and overall flow of this text. Keep the exact facts and core data completely intact, but make the rhythm deeply human, unpredictable, and uneven. Do not include labels or intro notes.

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

    // BULLETPROOF CLEANUP SYSTEM: Vaporizes brackets, parentheticals, and formatting artifacts completely
    function cleanText(input) {
      if (!input) return "";

      return input
        // 1. Erases "[which matters]", "(which matters)", or any floating variations with punctuation
        .replace(/[\[\(\{\s]*which\s+matters[\s\]\)\}\.\,]*(-*\s*)*/gi, " ")
        
        // 2. Converts all variations of em-dashes, en-dashes, and double hyphens into clean commas
        .replace(/\s*[—–——]\s*/g, ", ")
        .replace(/\s+-\s+/g, ", ")
        .replace(/-{2,}/g, ", ")
        
        // 3. General string sanitization
        .replace(/\b(\w+)\s+\1\b/gi, "$1") // Double words
        .replace(/,\s*,/g, ",")             // Double commas
        .replace(/,\s*\./g, ".")            // Trailing commas
        .replace(/\.\./g, ".")              // Double periods
        .replace(/\s{2,}/g, " ")            // Excess whitespace
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
