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
      systemInstruction: "You are a senior clinical auditor who writes with gritty, analytical density. You avoid all standard AI transitions. Your goal is to rewrite text to be indistinguishable from a human expert while maintaining every citation and score."
    }, { apiVersion: 'v1beta' });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `DECONSTRUCT AND RE-ENGINEER (Target 0-15% Detection):
          
          1. DETAIL-HEAVY RECONSTRUCTION: Match the input word count by adding analytical depth, not filler. If the input is long, maintain that density throughout. Never summarize.
          2. LINGUISTIC FRICTION: Use 'hard' verbs (e.g., 'weaponized', 'institutional inertia', 'hardwired knack'). Avoid polite phrases like "this indicates" or "it is important."
          3. BURSTINESS: Use extremely long, complex sentences with em-dashes (—) followed by mid-length technical statements. This non-linear rhythm is critical for a 0% score.
          4. CITATION PROTECTION: Strictly preserve every citation (e.g., Roehrich et al., 2014) in its original context.
          5. COMPLETION: You must finish the entire evaluation. Do not stall mid-sentence.
          
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.42, 
        topP: 0.99,
        thinkingConfig: {
          thinkingLevel: "HIGH" 
        },
        maxOutputTokens: 3500, 
      }
    });

    const response = await result.response;
    return res.status(200).json({ output: response.text().trim() });
    
  } catch (error) {
    console.error("Lite Error:", error.message);
    return res.status(500).json({ error: "System overload. Try again." });
  }
}
