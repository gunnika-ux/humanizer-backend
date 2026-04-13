import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    /**
     * MODEL CHOICE: gemini-3-flash-preview
     * - Quality: High-Fidelity Humanization.
     * - Cost: Standard Flash pricing ($0.50 per 1M tokens).
     * - Endpoint: v1beta (the only one that currently recognizes this ID).
     */
    const model = genAI.getGenerativeModel(
      { 
        model: "gemini-3-flash-preview", 
        systemInstruction: `You are a high-fidelity rewriter. 
        CRITICAL: Match the input length exactly. Do not skip any parts.
        
        HUMANIZATION RULES:
        1. UNBALANCED RHYTHM: Start occasional sentences with 'And', 'But', or 'So'. 
        2. SENTENCE JITTER: Follow long sentences with very short, sharp ones.
        3. HUMAN FRICTION: Use conversational asides—like 'frankly,' or 'the reality is'. 
        4. NO AI TRANSITIONS: Avoid 'Furthermore' or 'Moreover'.
        5. VOCABULARY: Use gritty, active verbs instead of clinical AI terms.`
      },
      { apiVersion: "v1beta" }
    );

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `TASK: Humanize this text while keeping the meaning and length identical. Do not stop until finished.
          
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.25, 
        topP: 0.98,
        maxOutputTokens: 4000, 
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    // Cleaning up any AI-added labels
    output = output.replace(/^(Option \d+|Output|Result|Humanized|Here's the rewrite):/gi, "");

    return res.status(200).json({ output: output });

  } catch (error) {
    console.error("API Connection Error:", error.message);
    return res.status(500).json({ error: "Handshake Failed", details: error.message });
  }
}
