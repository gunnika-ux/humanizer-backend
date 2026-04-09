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

        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.1-flash-lite-preview",
            // REWRITTEN: Professional Stealth Logic
            systemInstruction: `You are a Professional Editor. Your goal is to rewrite text to pass as human-written while maintaining 100% of the original professional meaning and data accuracy.

            STRICT RULES:
            1. MAINTAIN TONE: Keep it professional. Do not use slang like "messed up," "wild," or "total headache."
            2. THE "HUMAN FLOW": Mix sentence lengths. Use one long, detailed sentence (20+ words) followed by a short, punchy one (5-8 words).
            3. ACTIVE VOICE: Change passive AI phrasing like "It is generally considered" to active human phrasing like "Most experts see."
            4. BANNED AI WORDS: You must replace: "landscape," "tapestry," "imperative," "leverage," "foster," "robust," "comprehensive," and "delve." Use natural alternatives like "environment," "vital," "use," "help," and "look into."
            5. NO REPETITION: Never start two sentences in a row with the same word.
            6. DATA INTEGRITY: Keep all numbers ($4.2M, 12.5%) exactly as they are.
            7. OUTPUT ONLY the rewritten text.`,
        });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to sound like a natural human professional. Bypass all detectors without losing the original meaning: "${text}"` }]}],
            generationConfig: {
                // ADJUSTED TEMPERATURE: 0.85 is the "Sweet Spot" for staying on-topic but avoiding AI patterns
                temperature: 0.85, 
                topP: 0.9,
                topK: 25,
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
        return res.status(500).json({ error: `System Error: ${error.message}` });
    }
