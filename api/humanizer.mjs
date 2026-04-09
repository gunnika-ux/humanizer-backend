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
      systemInstruction: "You are a senior clinical auditor. You write with jagged, high-complexity prose that destroys robotic rhythms. Your goal is 0% detection by using aggressive, non-linear sentence structures and technical 'grit'."
    }, { apiVersion: 'v1beta' });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `TOTAL STRUCTURAL SABOTAGE (Target 0-10%):
          
          1. JAGGED RHYTHM: Every sentence must have a wildly different word count. Use one 60-word monster sentence followed immediately by a 4-word blunt statement.
          2. THE FRICTION RULE: Use 'hard' verbs (weaponized, gutting, cemented, anchored) to replace all polite academic phrasing.
          3. NO FILLER: Strictly avoid "it is important," "this suggests," or "the leader shows." Start sentences with direct technical observations.
          4. COMPLETION ANCHOR: You must process every domain provided in the input. If the input has two sections, you must output two sections. Do not stop until the final citation is reached.
          
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.5, // 🚀 Back to 1.5 for maximum randomness to break the 79%
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
