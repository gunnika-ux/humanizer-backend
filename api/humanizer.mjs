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
    
    // BACK TO GEMINI 3 FLASH (The one that gave you 0% AI scores)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a high-level human ghostwriter. 
      
      CRITICAL COMMAND: You must NOT summarize. You must expand on ideas slightly to ensure the output word count matches the input. 
      
      DETECTOR BYPASS (0% AI Target):
      1. RHYTHM: Mix very long sentences (35+ words) with short, punchy ones (4 words).
      2. VOCABULARY: Use technical but "messy" human terms. (e.g., instead of 'foster,' use 'kickstart' or 'trigger').
      3. FRICTION: Add em-dashes (—) and semicolons. Use parenthetical asides—like this—to break the robotic flow.
      4. NO AI MARKERS: Never use 'In conclusion', 'Furthermore', or 'Additionally'.
      
      Output ONLY the rewritten text.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `MIRROR THIS TEXT. Do not lose any details. Ensure every single point from the original is represented in the rewrite. 
          
          ORIGINAL TEXT (approx ${text.split(' ').length} words): "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.35, // High temperature is REQUIRED for 0% AI scores
        topP: 0.95,
        maxOutputTokens: 2500, 
      }
    });

    const response = await result.response;
    return res.status(200).json({ output: response.text().trim() });

  } catch (error) {
    return res.status(500).json({ error: "Engine sync error. Try again." });
  }
}
