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
      systemInstruction: `You are a high-fidelity human rewriter. 
      
      CRITICAL:
      - You must process the ENTIRE text. Do not cut off early.
      - Keep the meaning 100% identical.
      - Keep the tone professional but gritty and direct.

      DETECTOR BYPASS STRATEGY:
      1. SENTENCE JITTER: Follow a long, complex sentence (15-20 words) with a very short, punchy one (3-5 words).
      2. BANNED TRANSITIONS: Do not use "Furthermore," "Moreover," "In conclusion," or "Additionally." These are AI fingerprints.
      3. VOCABULARY: Use "messy" human-like word choices. Instead of "leverage," use "rely on." Instead of "foster," use "build."
      4. STARTING WORDS: Vary the start of every sentence. Do not start multiple sentences with "The" or "AI."`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Mirror the input text's length and meaning. 
          Use varied sentence structures to ensure it feels hand-written by an expert.
          Ensure you finish the entire thought.

          TEXT TO HUMANIZE:
          "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.8, // Raised to 0.8 for better "Perplexity" (beats ZeroGPT)
        topP: 0.95,
        maxOutputTokens: 4000, // Increased to prevent the cutoff problem
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

    const outputWords = output.split(/\s+/).length;

    // This is the line that triggered your "retry" error. 
    // We keep it, but the new instructions will prevent it from being triggered.
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
