import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Handle CORS (This stops the "Nothing Happens" bug)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Check if we have an API Key
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Configuration Error: API Key missing on Vercel." });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Stable version for 2026

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text provided." });
    }

    const prompt = `You are the "Humanizer X Pro" engine. Rewrite this to sound like a natural human: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const humanizedText = response.text();
    
    return res.status(200).json({ humanizedText });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "The Humanizer Engine is busy. Try again!" });
  }
}
