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
    
    // Use v1beta for better instruction following in Lite
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview", 
      systemInstruction: "You are a specialized linguistic engineer. Your task is to rewrite text to achieve 0% AI detection by introducing extreme 'burstiness' (sentence length variance) and unique syntactic structures. Use a professional, slightly cynical tone."
    }, { apiVersion: 'v1beta' });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `DECONSTRUCT AND REBUILD (Target 0% Scribbr):
          
          1. STRUCTURE: Rewrite using the '3-Layer Pulse': 
             - Sentence A: 45+ words (Complex/Detailed)
             - Sentence B: 3-5 words (Punchy/Direct)
             - Sentence C: 15 words (Balanced)
          2. VOCABULARY: Delete all 'AI markers': pivotal, underscore, multifaceted, foster, mitigate, landscape. Use direct, 'salty' verbs instead.
          3. INTERRUPTIONS: Use one em-dash (—) and one set of parentheses () to break the rhythmic flow of a long sentence.
          4. START: Begin with a claim, not an introduction.
          
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.5, // 🚀 High temperature is REQUIRED for Lite to pass Scribbr
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
