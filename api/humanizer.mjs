import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'No text provided' });

        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);

        // This works now because the ^0.22.0 library knows this model exists
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.1-flash-lite-preview",
            systemInstruction: {
                role: "system",
                parts: [{ text: "You are a Professional Human Editor. Rewrite text to sound natural. Avoid words like 'landscape' or 'leverage'. Use contractions and the 1-3-1 sentence rule. Output only the result." }]
            }
        });

        const result = await model.generateContent(text);
        const response = await result.response;
        const output = response.text().trim();

        return res.status(200).json({ output: output });

    } catch (error) {
        console.error("3.1 Flash-Lite Error:", error.message);
        return res.status(500).json({ error: `System Error: ${error.message}` });
    }
}
