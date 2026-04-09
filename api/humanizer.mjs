import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided." });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview", 
      systemInstruction: `You are a senior executive editor. Your specialty is transforming clinical leadership evaluations into high-impact, human-sounding prose that bypasses all AI detection. You maintain all academic citations (e.g., Roehrich et al., 2014) and technical scores while destroying robotic rhythmic patterns.`
    }, { apiVersion: 'v1beta' });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `DECONSTRUCT AND REBUILD (Target 0% Detection):
          
          1. STRUCTURE: Use the 'Reverse Pulse'. Start with a 50+ word analytical sentence (with a semi-colon), followed by a 3-word punch, then a standard technical explanation.
          2. CITATION INTEGRATION: Do not remove any names or years. Weave them naturally into the flow.
          3. NO SUMMARIES: Maintain the density of the evaluation. If the input covers two domains (Coalitions and Transformation), the output must cover both in detail.
          4. THE FRICTION RULE: Swap "AI-smooth" phrases like 'demonstrated an ability' for 'possessed a knack' or 'was hardwired to'.
          
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.45,
        topP: 0.98,
        // 🧠 SETTING THINKING TO HIGH:
        // This stops the "small stupid answers" by forcing the model to 
        // process the complexity of the clinical domains first.
        thinkingConfig: {
          thinkingLevel: "HIGH" 
        },
        maxOutputTokens: 2500,
      }
    });

    const response = await result.response;
    return res.status(200).json({ output: response.text().trim() });
    
  } catch (error) {
    console.error("Reasoning Error:", error.message);
    return res.status(500).json({ error: "High-level processing failed. Try again." });
  }
}
