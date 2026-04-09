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
      systemInstruction: "You are a rogue academic editor. You hate standard AI writing. You use dense, jagged, and non-linear prose. Your goal is to bypass detection by making the text feel manually 'over-engineered' and structurally unpredictable."
    }, { apiVersion: 'v1beta' });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `STRUCTURAL SABOTAGE (Target 0-10% Detection):
          
          1. THE JAGGED RULE: Break every sentence rhythm. Use dashes (—), semi-colons (;), and brackets [] aggressively. 
          2. LINGUISTIC FRICTION: Swap all academic verbs for high-impact professional ones (e.g., 'gutted', 'cemented', 'weaponized', 'anchored'). 
          3. NO ROBOTIC FLOW: Never start a sentence with "This," "It," "Furthermore," or "Additionally." Start with the core noun or a technical observation.
          4. CITATION MASKING: Weave the citations (e.g., Roehrich et al., 2014) into the middle of complex sentences, never at the end.
          5. COMPLETION: Finish every domain. Do not stop until the final period of the Systems Transformation section.
          
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.5, 
        topP: 1.0, // 🚀 Maximum diversity of word choice
        thinkingConfig: {
          thinkingLevel: "HIGH" 
        },
        maxOutputTokens: 3500, 
      }
    });

    const response = await result.response;
    return res.status(200).json({ output: response.text().trim() });
    
  } catch (error) {
    console.error("Lite Logic Error:", error.message);
    return res.status(500).json({ error: "System overload. Try again." });
  }
}
