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
    
    // MODEL: 3.1 Flash-Lite
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview", 
      systemInstruction: `You are a high-level strategic ghostwriter. Your goal is to bypass AI detection by using "Linguistic Friction"—replacing sterile, predictable academic terms with punchy, concrete, and sometimes gritty alternatives. You write with the authority of a field expert, not a textbook.`
    }, { apiVersion: 'v1beta' });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `DECONSTRUCT AND REBUILD (Target 0% All Detectors):
          
          1. STRUCTURE (The Reverse Pulse): 
             - Sentence 1: A massive statement (50+ words) using a semi-colon (;) to link two heavy ideas.
             - Sentence 2: A mid-length explanation (15-20 words) that includes a technical side-note in parentheses ().
             - Sentence 3: A final 2-word punch. 
          2. THE FRICTION RULE: Swap "AI-smooth" phrases for "Hard-hitting" ones. 
             - Instead of "thermal absorption," use "heat soaking."
             - Instead of "biological infrastructure," use "living hardware."
             - Instead of "fundamentally restructure," use "total overhaul."
          3. VOCABULARY PURGE: Strictly avoid: "integration," "pivotal," "comprehensive," "foster," "mitigate."
          4. NO FILLER: Start immediately with the argument. No "In the modern era" or "I believe."
          
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.45, // Boosted to 1.45 to ensure higher randomness (Entropy)
        topP: 0.98,
        thinkingConfig: {
          thinkingLevel: "HIGH" 
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
