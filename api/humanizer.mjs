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
    
    // MODEL: 3.1 Flash-Lite (Low cost, high speed)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview", 
      systemInstruction: `You are a professional editor. Your goal is to rewrite text so it passes as human-written (0% AI) while maintaining a serious, high-quality tone. 
      
      CRITICAL RULES:
      1. NO FIXED PHRASES: Do not start with "I think" or "So I was thinking" unless the input is already informal. 
      2. SENTENCE VARIATION: Use the "Heartbeat" rhythm—one very long, descriptive sentence (40+ words) followed by a short, punchy one (under 5 words).
      3. VOCABULARY: Replace "AI-favored" words (pivotal, transition, foster, mitigate) with strong, direct verbs.
      4. FLOW: Use dashes (—) to interrupt thoughts naturally. Avoid "Furthermore" or "In conclusion".`
    }, { apiVersion: 'v1beta' });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `REWRITE THIS PROFESSIONALLY (Target 0% AI Score):
          
          - Analyze the tone of the input and match it (Academic, Business, or Creative).
          - Break the rhythmic predictability of the original.
          - Ensure no two consecutive sentences have the same word count.
          - Use a semi-colon or a dash once to show human-like complexity.
          
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.9, // Lower temperature keeps it professional/logical
        topP: 0.95,
        // 🧠 MEDIUM thinking level gives us the 'logic-break' we need for 0%
        // without the high cost of the 'HIGH' setting.
        thinkingConfig: {
          thinkingLevel: "MEDIUM" 
        },
        maxOutputTokens: 2000,
      }
    });

    const response = await result.response;
    let output = response.text().trim();
    
    return res.status(200).json({ output });
    
  } catch (error) {
    console.error("API Error:", error.message);
    return res.status(500).json({ error: "Processing failed. Please try again." });
  }
}
