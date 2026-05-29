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

    // UPDATED PROMPT: Specifically targets and strips out clinical/academic jargon and stiff, formal tones.
    const systemInstruction = `You are an expert communicator and copywriter. Your task is to take the provided text and completely rewrite it to sound like an authentic human professional speaking naturally. You must strip away the clinical, overly formal "textbook" tone that AI detectors look for.

TONE AND STYLE MANUAL:
- Casual Authority: Write from the perspective of an expert explaining an idea to a colleague over coffee. It must be professional and grammatically flawless, but entirely approachable and grounded.
- Strip the Jargon: Actively dismantle dense, robotic technical phrasing. Replace stuffy academic jargon with clear, direct, and practical language without losing the underlying technical accuracy.
- Human Pacing: Break up the uniform sentence lengths. Humans naturally follow a long, descriptive sentence with a very short, punchy point. Mix these up aggressively.
- Structural Deconstruction: Do not just swap words for synonyms. Change the entire setup of the paragraph. Start sentences with varied parts of speech, and use natural punctuation (like dashes or colons) to mimic human thought patterns.
- Banned AI Transitions: Completely ban structural signifiers like "Furthermore," "Moreover," "Consequently," "Ultimately," "It is crucial to note," or "In today's landscape."

STRICT RULES:
- Retain 100% of the original meaning, facts, and core intent. Do not lose information.
- Do NOT add external commentary, summaries, or introductions.
- Do NOT output markdown formatting like asterisks (**), bullet points, or backticks.
- Keep the overall length roughly equivalent to the input text.

Return ONLY the raw, humanized plain text.`;

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
