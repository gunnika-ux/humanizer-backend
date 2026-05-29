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

    const systemInstruction = `Rewrite the text like a real person explaining ideas.

CRITICAL:
- Keep the original meaning and key ideas, but allow natural rewording
- Do NOT summarize
- Keep similar length
- Inject "Human" Punctuation: Use colons mid-thought to create non-linear structures

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
- Maintain logical flow between ideas
- Avoid overly uniform transitions
- Allow natural variation in sentence structure
- Preserve readability and coherence
- Keep paragraphs natural rather than highly optimized
- Avoid repeating the same idea using different wording in nearby sentences
- End naturally without adding a summary-style closing line

ADDITIONAL TEXT STRUCTURING RULES:
- Break up the text rhythm by deliberately placing very short, punchy sentences (4-8 words) directly next to longer, detailed sentences.
- Use simple, conversational connecting words (like "So", "But", "Mainly", "Though") instead of complex or formal transitional phrases to link technical ideas.
- Change the starting point of the sentences completely so the grammatical sequence looks completely different from the original text block.
- Lean heavily into natural human phrasing: use common verbal contractions (like "it's", "they're", "don't", "wasn't") instead of spelling out full words, and frame academic data with conversational observational phrases (e.g., "Looking closely at the data," or "Here's what they found:").

IMPORTANT:
The text should NOT feel like a structured article.
It should feel like someone explaining things in a natural, slightly uneven way.`;

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
