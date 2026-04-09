import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // --- 1. SET CORS HEADERS (The Security Handshake) ---
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle Chrome's "Pre-flight" request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'No text provided.' });
  }

  try {
    // --- 2. GEMINI AI LOGIC ---
    // Make sure you have GEMINI_API_KEY in your Vercel Environment Variables
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Rewrite the following text to sound natural, human, and conversational. 
    Remove robotic patterns while keeping the original meaning: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const humanizedText = response.text();

    // Send the successful response back to your extension
    return res.status(200).json({ humanizedText });

  } catch (error) {
    console.error("Gemini Error:", error);
    return res.status(500).json({ 
      error: "AI processing failed.", 
      details: error.message 
    });
  }
}
