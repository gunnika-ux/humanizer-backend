import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // FIX: Check if body exists first
    if (!req.body) {
      return res.status(400).json({ error: "Please send a POST request with text." });
    }

    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: "No text provided in the request body." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(`Rewrite this to be human-like and professional: ${text}`);
    const response = await result.response;
    const output = response.text();

    return res.status(200).json({ output: output.trim() });

  } catch (error) {
    console.error("Backend Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
