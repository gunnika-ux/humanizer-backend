import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const inputWords = text.split(/\s+/).length;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a professional human editor rewriting text to bypass AI detection.

CRITICAL FOR ZEROGPT:
- VARY SENTENCE LENGTH: Use a mix of very long (30+ words) and very short (3-5 words) sentences. This is "Burstiness."
- PERPLEXITY: Use less predictable word pairings. Instead of "rapid advancement," use "the fast-moving climb."
- BANNED WORDS: Never use "Moreover," "Furthermore," "In conclusion," "Unprecedented," or "Leverage."
- NO REPETITION: Do not start consecutive sentences with the same word.
- FLOW: Break the logical "AI rhythm." Humans often put the most important point in the middle of a paragraph, not just at the start.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this text. Make it sound human and professional. 
          Vary the sentence structures aggressively to lower the AI probability score.
          Keep the total word count similar to the input.

          TEXT:
          "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.9,   // 🔥 Increased to 0.9 to maximize word variety
        topP: 0.95,        // Allows more creative word choices to confuse ZeroGPT
        maxOutputTokens: 3000,
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

    const outputWords = output.split(/\s+/).length;

    if (outputWords < inputWords * 0.6) {
      return res.status(200).json({
        output: output + " ...[retry for fuller rewrite]"
      });
    }

    return res.status(200).json({ output });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
