import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  maxDuration: 60, 
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text" });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a high-fidelity rewriter. 
      CRITICAL: Match input length exactly. Do not truncate.
      
      HUMANIZATION:
      1. Start occasional sentences with 'And', 'But', or 'So'. 
      2. Follow a long sentence with a very short one.
      3. Use conversational asides sparingly. 
      4. Use em-dashes (—) and semicolons for human flow.`
    });

    // We set a 55s timeout so we finish before Vercel kills us at 60s
    const result = await Promise.race([
      model.generateContent({
        contents: [{ role: "user", parts: [{ text: `Mirror and humanize this exactly: "${text}"` }] }],
        generationConfig: { temperature: 1.30, topP: 0.95, maxOutputTokens: 4000 }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI Engine Timeout')), 55000))
    ]);

    const response = await result.response;
    let output = response.text().trim();
    output = output.replace(/^(Option \d+|Output|Result|Rewrite):/gi, "");

    return res.status(200).json({ output: output });

  } catch (error) {
    return res.status(500).json({ error: "Engine sync error", details: error.message });
  }
}
