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

        // 🚀 THE FIX: We add { apiVersion: 'v1beta' } to find the 3.1 model
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.1-flash-lite-preview",
            systemInstruction: {
                parts: [{ text: `You are a Professional Human Editor. 
                STRICT RULES:
                1. Replace "landscape" with "environment", "leverage" with "use", and "delve" with "examine".
                2. Use the 1-3-1 rule: Mix short and long sentences.
                3. Use contractions like "it's" and "we've".
                4. Keep all numbers like $4.2M and 12.5% exactly as they are.
                5. Output ONLY the rewritten text.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Humanize this professionally: "${text}"` }]}],
            generationConfig: {
                temperature: 0.82, 
                topP: 0.9,
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
        console.error("3.1 Lite Error:", error.message);
        return res.status(500).json({ error: `System Error: ${error.message}` });
    }
}
