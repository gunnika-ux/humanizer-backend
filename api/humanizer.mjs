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
      systemInstruction: `You are a high-level professional editor. Rewrite this text to be 100% human-passing.

HUMANIZING PROTOCOLS:
1. FRAGMENTATION: Occasionally use a sentence fragment for emphasis. (e.g., "The reality? It's complicated.")
2. ASYMMETRIC SENTENCES: Write one very long, descriptive sentence followed by two very short ones. This "chaos" is how humans write.
3. BANNED VOCABULARY: Do not use: 'Furthermore', 'Moreover', 'Consequently', 'Paradigm', 'Leverage', 'Foster'.
4. NO REPETITION: Never start two sentences with the same word. 
5. WORD COUNT: You must match the length of the input. If you are too short, the system fails. Expand on the "why" and "how" to keep the word count up.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this professionally but with heavy "human friction." 
          Break the predictable AI rhythm entirely. 
          Keep the word count close to the original.

          TEXT:
          "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.88, // Pushing for more randomness to beat 100% scores
        topP: 0.95,        
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
