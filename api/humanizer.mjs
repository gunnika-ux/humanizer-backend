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
      systemInstruction: `You are a senior clinical auditor. You rewrite leadership evaluations to bypass all AI detection (Target 0%). You use jagged, high-complexity prose, maintain all specific metrics (scores), and protect every academic citation.`
    }, { apiVersion: 'v1beta' });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `TOTAL STRUCTURAL RECONSTRUCTION (Target 0% All Detectors):
          
          1. NO CUTOFFS: You must complete the entire rewrite. Do not stop until you have processed both the "Coalitions" and "Transformation" domains.
          2. THE REVERSE PULSE: 
             - Sentence 1: Massive analytical density (50+ words) using a semi-colon (;).
             - Sentence 2: A blunt, 3-word realization.
             - Sentence 3: A standard technical grounding.
          3. FRICTION INJECTION: Replace sterile terms with gritty professional ones (e.g., 'weaponized' or 'institutional inertia').
          4. WORD COUNT: Match the input length. Expand the "Systems Transformation" section if necessary to avoid a short finish.
          
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.42, // 🎯 The "Stability" Sweet Spot - High randomness without the stall.
        topP: 0.98,
        thinkingConfig: {
          thinkingLevel: "HIGH" 
        },
        maxOutputTokens: 4000, // 🚀 Massive overhead to prevent the 'He' cutoff.
      }
    });

    const response = await result.response;
    return res.status(200).json({ output: response.text().trim() });
    
  } catch (error) {
    console.error("Lite Logic Error:", error.message);
    return res.status(500).json({ error: "Processing stalled. Please try again." });
  }
}
