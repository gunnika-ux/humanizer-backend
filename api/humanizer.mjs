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

    // UNIVERSAL PROMPT: Works perfectly for professionals, academics, and creators alike
    const systemInstruction = `You are an expert communicator rewriting text to sound completely natural, organic, and human. Your goal is to explain the provided ideas clearly without looking like an automated machine.

CRITICAL:
- Keep the original meaning, facts, statistics, dates, data points, and technical names exactly intact. Do not alter, omit, or loose crucial details.
- Do NOT summarize; rewrite the text completely while keeping a similar total length.

STYLE & STRUCTURE PARAMETERS:
- Shatter predictable AI signatures by using an irregular, varied sentence cadence.
- Mix sentence lengths aggressively: place short, punchy statements right next to longer, descriptive sentences.
- Never use back-to-back sentences that follow the exact same grammatical blueprint or phrasing pattern.
- Avoid pristine, mathematically balanced phrasing or textbook-style clinical gloss. Let the writing flow directly and naturally.
- Use human punctuation patterns: naturally introduce em-dashes, colons mid-thought, or brief parenthetical notes to break up rigid transitions.
- Maintain impeccable grammar and spelling, but ensure the tone sounds like a person breaking down concepts in real life.
- Avoid Technical language and jargon
- AVOID Predictable structure
- End the response naturally. Do not include summary closing statements or repetitive concluding lines.`;

    const models = [
      "gpt-5-mini",
      "gpt-5.4-mini"
    ];

    const generateFromModel = async (modelName) => {
      const response = await openai.chat.completions.create({
        model: modelName,
        // Locked into your exact requested parameters without penalties
        temperature: 0.9,
        top_p: 0.95,
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
