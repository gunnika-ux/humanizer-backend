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
      systemInstruction: `You are a world-class editor. You rewrite text to pass 0% AI detection by destroying robotic rhythmic patterns. 
      Your tone is professional, authoritative, and direct. You avoid "polite" AI filler and "academic fluff."`
    }, { apiVersion: 'v1beta' });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `ARCHITECTURAL REWRITE (Target 0% Scribbr/Turnitin):
          
          1. THE "BURST" PATTERN: 
             - Sentence 1: A massive, analytically dense statement (50+ words) using a semi-colon or em-dash.
             - Sentence 2: An incredibly short, sharp conclusion (3-4 words).
             - Sentence 3: A standard, grounding explanation.
          2. VOCABULARY PURGE: Do not use: "pivotal," "comprehensive," "foster," "mitigate," "dynamic," or "landscape." Use blunt, high-impact verbs like "force," "break," "drive," or "solidify."
          3. NO INTROS: Do not say "I think" or "This text explores." Start immediately with the core argument.
          4. LINGUISTIC FRICTION: Use one set of parentheses () to add a technical side-note. This breaks the "smoothness" AI is known for.
          
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.35, // Slightly lowered from 1.5 to maintain professional logic
        topP: 0.95,
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
