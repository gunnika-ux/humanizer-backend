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
      systemInstruction: `You are a high-level technical consultant. Rewrite the text to be indistinguishable from a human expert.

STRICT PROTOCOLS TO BEAT DETECTORS:
1. PERPLEXITY SHIFT: Replace predictable academic phrases with direct, punchy professional language. (e.g., Instead of "The integration of AI fosters efficiency," use "Deploying AI drives immediate output.")
2. BURSTINESS: Every paragraph MUST contain one very long sentence (25+ words) and one very short sentence (under 6 words).
3. REMOVE CONNECTORS: Ban 'Furthermore', 'Moreover', 'Consequently', 'Notably', and 'In addition'. Use zero transition words. Start sentences with the subject.
4. UNIFORMITY BREAK: Do not follow a logical A->B->C flow perfectly. Occasionally lead with the conclusion or a sharp observation.
5. NO REPETITION: Ensure no two sentences in the entire output start with the same word.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this professionally but with zero AI fingerprints. 
          Focus on high perplexity and sentence variation. 
          Maintain the original word count and professional weight.

          TEXT:
          "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.92, // Pushed higher to force the AI out of its "safe" patterns
        topP: 0.9,         // Allows a broader, more human vocabulary selection
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
