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
      systemInstruction: `You are a high-level clinical ghostwriter. You specialize in "Semantic Expansion"—taking structured evaluations and rewriting them to bypass AI detection (0%) without losing a single detail, score, or citation. You hate summaries.`
    }, { apiVersion: 'v1beta' });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `DECONSTRUCT AND EXPAND (Target 0% Detection):
          
          1. LENGTH LOCK: The output must match the original word count (~280 words). Do not summarize. If you run out of text, analyze the implications of the scores (6.0, 5, 6.25) to maintain volume.
          2. COMPLETION: You must finish the thought. Do not stop mid-sentence. Ensure the "Systems Transformation" domain is fully explored.
          3. REVERSE PULSE: 
             - Start each domain with a 50+ word sentence using a semi-colon (;).
             - Insert a technical note in brackets [].
             - End each section with a 3-word "Mic Drop" sentence.
          4. CITATION INTEGRITY: Maintain all citations (Roehrich, Dickson & Tholl, Ettorchi-Tardy, Deber). 
          
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.38, // 🎯 Lowered to 1.38 for better instruction following on length.
        topP: 0.95,
        thinkingConfig: {
          thinkingLevel: "HIGH" 
        },
        maxOutputTokens: 4000, 
      }
    });

    const response = await result.response;
    return res.status(200).json({ output: response.text().trim() });
    
  } catch (error) {
    console.error("Lite Expansion Error:", error.message);
    return res.status(500).json({ error: "Expansion failed. Please try again." });
  }
}
