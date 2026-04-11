import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (!req.body || !req.body.text) {
      return res.status(400).json({ error: "No text provided." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // UPDATED FOR APRIL 2026 STABILITY
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash" 
    });

    const result = await model.generateContent(`Rewrite this to be human-like: ${req.body.text}`);
    const response = await result.response;
    
    return res.status(200).json({ output: response.text().trim() });

  } catch (error) {
    console.error("Gemini Error:", error.message);
    // This sends the actual Google error back to your extension so we can see it
    return res.status(500).json({ error: `Engine Error: ${error.message}` });
  }
}
