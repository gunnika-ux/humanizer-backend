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

        // 🚀 This is the only way to call the 3.1 Lite engine in 2026
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.1-flash-lite-preview",
            systemInstruction: `You are a Professional Human Editor. Rewrite text to achieve a 0% AI score. 
            
            STRICT RULES:
            - Swaps: "environment" for "landscape", "vital" for "imperative", "use" for "leverage".
            - Style: Use contractions (it's, don't) and vary sentence lengths.
            - No "Furthermore" or "In conclusion".
            - Keep numbers ($4.2M, 12.5%) exact.`,
        });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Humanize this: "${text}"` }]}],
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
        return res.status(500).json({ error: `System Error: ${error.message}` });
    }
}
