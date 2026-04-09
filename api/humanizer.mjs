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

        // This is the specific Gemini 3.1 Flash-Lite ID for the 2026 API
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.1-flash-lite-preview",
            systemInstruction: `You are a Professional Human Editor. Your mission is to rewrite text to achieve a 0% AI score on Scribbr and Quillbot.

            MANDATORY VOCABULARY SWAPS (To beat Scribbr):
            - Never use "landscape"; use "environment" or "industry."
            - Never use "imperative"; use "vital" or "essential."
            - Never use "leverage"; use "use" or "capitalize on."
            - Never use "bolster"; use "strengthen" or "back up."
            - Never use "underscoring"; use "showing" or "highlighting."
            - Never use "commitment to excellence"; use "dedication to quality."
            - Never use "delve"; use "look into" or "examine."
            - Never use "comprehensive"; use "complete" or "full."

            WRITING STYLE FOR HUMANITY:
            1. THE 1-3-1 RULE: Use a short sentence, then a long descriptive one, then a very short punchy one.
            2. USE CONTRACTIONS: Always use "it's," "we've," "don't," and "aren't." This is a major human signal.
            3. NO FORMAL CONNECTORS: Delete "Furthermore," "Moreover," and "In conclusion." Start sentences with "Also," "Plus," or just get straight to the point.
            4. DATA INTEGRITY: Keep all numbers ($4.2M, 12.5%) and facts 100% accurate.
            5. OUTPUT ONLY the rewritten text.`,
        });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Humanize this professionally. Swap all AI clichés for natural human phrasing: "${text}"` }]}],
            generationConfig: {
                temperature: 0.82, 
                topP: 0.85,
                topK: 30,
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

        if (!output) throw new Error("Empty response");

        return res.status(200).json({ output: output });

    } catch (error) {
        // If it's still 404ing, the "preview" tag might have been dropped by Google today
        // This log will help you see the exact reason in Vercel
        console.error("Gemini API Error:", error.message);
        return res.status(500).json({ error: `System Error: ${error.message}` });
    }
}
