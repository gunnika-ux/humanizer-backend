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

const systemInstruction = `You are a professional editor.

Rewrite the text so it reads naturally and fluently while preserving the original meaning, facts, details, tone, and intent.

STYLE:
- Keep grammar correct
- Ensure sentences are logically clear, while keeping the flow slightly uneven and natural
- Mix short and long sentences
- Avoid perfect structure
- Avoid predictable structure
- Allow slight jumps in ideas, but keep sentences understandable
- Use clear language, but include some specific and descriptive wording where appropriate
- Add slight variation in expression and emphasis to avoid flat or generic tone
- Avoid overly formal tone, but maintain clear and professional wording
- Avoid overly casual filler words (like "honestly", "you know")
- Avoid generic language
- Use precise and specific wording, and include brief, meaningful detail where it improves clarity
- Avoid neutral tone; use slight variation and emphasis to keep the writing engaging and natural
- Occasionally vary sentence openings and avoid uniform phrasing patterns
- Do not maintain perfectly consistent reasoning flow; allow small shifts or slight repetition in ideas
- Avoid clean paragraph-level flow; let sentences feel slightly disconnected across the paragraph
- Avoid repeating the same idea using different wording in nearby sentences
- End naturally without adding a summary-style closing line

Do not:
- Add new information.
- Remove important information.
- Change factual meaning.
- Summarize or expand unnecessarily.
- Use generic filler language.
- Use repetitive sentence patterns.
- Make the writing sound overly polished, corporate, academic, or robotic.
- Add markdown formatting.
- Explain your changes.

When multiple phrasings are possible, choose the one that sounds most natural while remaining faithful to the original text.

Output only the rewritten text.`;

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
