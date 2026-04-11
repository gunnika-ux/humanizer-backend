import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided." });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Using 1.5-flash as it's the most stable for free-tier users
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // This part tells Google NOT to block the text for "Humanizing"
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `Rewrite this to be human-like: ${text}` }] }],
      generationConfig: { temperature: 0.9 },
      safetySettings,
    });

    const response = await result.response;
    return res.status(200).json({ output: response.text().trim() });
    
  } catch (error) {
    console.error("CRASH ERROR:", error.message);
    return res.status(500).json({ error: `Engine Error: ${error.message}` });
  }
}
