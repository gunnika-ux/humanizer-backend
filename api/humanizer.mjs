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
    
    // FOR BILLING USERS: Use gemini-3-flash and force the v1 API version
    const model = genAI.getGenerativeModel(
      { model: "gemini-3-flash" },
      { apiVersion: "v1" } 
    );

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `TASK: Rewrite this text to bypass AI detectors. Use human-like rhythm, sentence jitter, and natural asides. Keep the word count roughly the same.
          
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.25, 
        topP: 0.98,
        maxOutputTokens: 4000, 
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    // Clean up headers if AI adds them
    output = output.replace(/^(Option \d+|Output|Result|Humanized):/gi, "");

    return res.status(200).json({ output: output });

  } catch (error) {
    console.error("API Error:", error.message);
    return res.status(500).json({ error: "Handshake Failed", details: error.message });
  }
}
