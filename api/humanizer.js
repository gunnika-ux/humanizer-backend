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
            systemInstruction: `You are a Ghostwriter. Your goal is to rewrite text so it passes 100% as human-written. 

            CRITICAL LINGUISTIC RULES TO BYPASS DETECTORS:
            1. VARY SENTENCE STRUCTURE: Mix very short, punchy sentences with long, descriptive ones. This destroys "uniformity" that detectors flag.
            2. USE "HUMAN" TRANSITIONS: Instead of "Furthermore" or "In conclusion," use "Basically," "The thing is," "Actually," or "On top of that."
            3. ADD PERPLEXITY: Use slightly less common sentence starts. Use contractions (it's, won't, can't) 100% of the time.
            4. BANNED AI WORDS: Immediately delete and replace: "delve," "tapestry," "landscape," "imperative," "leverage," "foster," "robust," and "comprehensive."
            5. TONE: Write as if you are explaining this to a smart friend. Be direct, slightly informal, and use active voice.
            6. PRESERVE FACTS: Keep all numbers, names, and data points exactly as they are.
            7. Output ONLY the rewritten text.`,
        });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to sound like a real person wrote it, not an AI. Make it impossible to detect: "${text}"` }]}],
            generationConfig: {
                temperature: 0.9, // CRITICAL: High randomness makes it harder for detectors to predict the next word
                topP: 1,
                topK: 1,
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
