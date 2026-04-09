import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // Standard CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Input text is required' });

        // Check if the environment variable is actually loaded
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'System Error: API Key missing in Vercel settings.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

        const prompt = `Rewrite the following text to sound 100% human, natural, and conversational. Remove all AI-style formatting and robotic sentence structures: "${text}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        return res.status(200).json({ output: response.text() });

    } catch (error) {
        console.error("Gemini Error:", error.message);
        // Returns the actual error message so we can fix it
        return res.status(500).json({ error: `AI Error: ${error.message}` });
    }
}
