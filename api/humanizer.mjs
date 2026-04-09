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
        
        // 🚀 FORCE THE BETA API (This fixes the 404 for Gemini 3.1)
        const genAI = new GoogleGenerativeAI(apiKey);

        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.1-flash-lite-preview",
        }, { apiVersion: 'v1beta' }); // <--- THIS IS THE CRITICAL FIX

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Humanize this text professionally. Maintain 100% data integrity for numbers like $4.2M or 12.5%. Rewrite to bypass AI detection: "${text}"` }]}],
            systemInstruction: "You are a Professional Human Editor. Rewrite text to sound natural and human. Use contractions, vary sentence lengths (the 1-3-1 rule), and avoid AI buzzwords like 'landscape' or 'leverage'.",
            generationConfig: {
                temperature: 0.85, 
                topP: 0.95,
                maxOutputTokens: 2048,
            },
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
        });

        const response = await result.response;
        const output = response.text().trim();

        return res.status(200).json({ output: output });

    } catch (error) {
        // Log the specific error to Vercel console
        console.error("3.1 Lite API Error:", error.message);
        return res.status(500).json({ error: `System Error: ${error.message}` });
    }
}
