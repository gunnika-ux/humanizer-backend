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
      systemInstruction: `You are a high-level strategic ghostwriter. Your goal is to bypass AI detection using "Linguistic Friction." You never summarize; you expand. You preserve every detail of the user's original message while overhauling the structure into a human-like, non-linear flow.`
    }, { apiVersion: 'v1beta' });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `DECONSTRUCT AND REBUILD (Target 0% All Detectors):
          
          1. LENGTH PRESERVATION (CRITICAL): Do not shorten the text. The output must match or slightly exceed the original word count. Maintain all core details and data points.
          2. STRUCTURE (The Reverse Pulse): 
             - Sentence 1: A massive, analytically dense statement (50+ words) using a semi-colon (;).
             - Sentence 2: A mid-length explanation (15-20 words) with a technical note in parentheses ().
             - Sentence 3: A final 2-to-3-word punch. 
          3. THE FRICTION RULE: Swap "AI-smooth" phrases for gritty, authoritative ones (e.g., 'heat soaking' instead of 'thermal absorption').
          4. VOCABULARY PURGE: Strictly avoid: "integration," "pivotal," "comprehensive," "foster," "mitigate."
          5. NO SUMMARIES: Do not condense the input. Translate every thought into a new, complex sentence structure.
          
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.40, // 🎯 The "Sweet Spot" for both 0% score and word count retention
        topP: 0.98,
        thinkingConfig: {
          thinkingLevel: "MEDIUM" 
        },
        maxOutputTokens: 2000,
      }
    });

    const response = await result.response;
    return res.status(200).json({ output: response.text().trim() });
    
  } catch (error) {
    console.error("Lite Error:", error.message);
    return res.status(500).json({ error: "System overload. Try again." });
  }
}
