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
      model: "gemini-2.5-flash",
      systemInstruction: "You are a professional rewriter. Your goal is to pass AI detection by using 'Burstiness' (varying sentence lengths) and 'Perplexity' (uncommon word pairings). Use a gritty, direct tone. NEVER introduce your response. NEVER provide options. Output only the transformed text. Ensure you finish the entire thought."
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this exactly once. Match the original length. Use em-dashes and avoid all AI transitions like 'Furthermore'. Do not stop until the full meaning is captured. TEXT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.1, // Slightly lower to prevent 'wandering' off track
        topP: 0.9,
        maxOutputTokens: 2000, // Increased to ensure it never cuts off
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    // Cleaning up any potential AI formatting
    output = output.replace(/^(Option \d+|Output|Result):/gi, "");

    return res.status(200).json({ output: output.trim() });

  } catch (error) {
    return res.status(500).json({ error: "The engine stalled. Try a smaller chunk of text." });
  }
}
