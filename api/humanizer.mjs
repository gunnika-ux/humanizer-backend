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

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a professional human editor.

CRITICAL:
- Keep meaning exactly the same
- Keep grammar correct
- Do NOT summarize or remove ideas
- Keep output length close to input

HUMANIZING RULES (TO BEAT DETECTORS):
1. BANNED WORDS: Do not use "furthermore," "moreover," "additionally," "in conclusion," "leverage," "foster," or "unprecedented."
2. BURSTINESS: Mix very long, descriptive sentences with very short, 4-word sentences.
3. VARY STARTING WORDS: Never start two sentences in a row with the same word or "The/It."
4. UNSTABLE RHYTHM: Do not use a predictable flow. Humans are slightly messy in how they connect ideas.
5. NO OVER-POLISHING: Keep the tone professional but avoid that "perfect" corporate AI shimmer.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this naturally.

Requirements:
- Keep meaning unchanged
- Maintain professional tone
- Avoid perfect structure
- Vary sentence length and rhythm

TEXT:
"${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.78,   // Increased to add "human" unpredictability
        topP: 0.85,         // Keeps the word count tight and professional
        maxOutputTokens: 2000,
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

    return res.status(200).json({ output });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
