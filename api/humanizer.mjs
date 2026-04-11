import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text" });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a high-end human ghostwriter. 
      
      STRICT DATA INTEGRITY: 
      - You are FORBIDDEN from summarizing. 
      - If the input is 250 words, your output MUST be 250-300 words. 
      - If you run out of things to say, use descriptive human 'filler' and elaborate on the metaphors.
      
      HUMAN SIGNATURES (0% AI TARGET):
      1. VARY sentence length aggressively.
      2. Use em-dashes (—) to connect complex thoughts.
      3. Use 'low-probability' words: instead of 'important', use 'pivotal' or 'non-negotiable'.
      4. Avoid all AI list-making and transitions.
      
      Output ONLY the rewritten text. Start immediately.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `REWRITE AND EXPAND: Take every single idea in this text and rewrite it with human 'texture'. Do not let the word count drop. 
          
          ORIGINAL CONTENT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.25, // Slightly lowered from 1.35 to prevent the "cutoff" bug
        topP: 0.98,        // High P allows for more diverse word choices
        maxOutputTokens: 3000, 
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    // Final check: If the AI still tried to be "helpful" by adding a header, strip it.
    output = output.replace(/^(Option \d+|Rewrite|Result):/gi, "");

    return res.status(200).json({ output: output.trim() });

  } catch (error) {
    return res.status(500).json({ error: "The engine stalled. Please try again." });
  }
}
