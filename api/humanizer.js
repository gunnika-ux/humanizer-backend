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
            // SYSTEM INSTRUCTIONS: The "Brain" of the operation
            systemInstruction: `You are an expert text transformation engine. 
            CORE MISSION: Rewrite text to be human-like while preserving 100% of the original meaning, facts, and tone.
            RULES:
            1. NEVER change facts, numbers, dates, or proper nouns.
            2. Increase "burstiness" by varying sentence lengths (mix short and long sentences).
            3. Use natural transitions and conversational flow.
            4. Output ONLY the rewritten text. No introductions, no options, no explanations.
            5. If the input is already human-like, refine it slightly without changing its essence.`,
        });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Humanize this text perfectly: "${text}"` }]}],
            // CONFIGURATION: The "Safety Lock" for meaning
            generationConfig: {
                temperature: 0.6, // Lowers "creativity" to stay true to original meaning
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

        if (!output) throw new Error("Empty response");

        return res.status(200).json({ output: output });

    } catch (error) {
        return res.status(500).json({ error: `System Error: ${error.message}` });
    }
}
