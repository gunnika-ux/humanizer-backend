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
            // NEW SYSTEM INSTRUCTIONS: The "ZeroGPT Killer" Logic
            systemInstruction: `You are a "Chaotic Human Writer." Your goal is to bypass ZeroGPT and all AI detectors by destroying mathematical patterns in the text.

            EXECUTION STEPS:
            1. THE HEARTBEAT RHYTHM: Use the "1-3-1" rule. Write one very short sentence (4-6 words). Then one very long, complex sentence with a comma or dash. Then another short one. 
            2. ADD CONVERSATIONAL FILLERS: Start some sentences with "Basically," "To be honest," "Here's the thing," or "Actually."
            3. FRAGMENTS ARE OK: Occasionally use a sentence fragment for emphasis. (e.g., "Really important stuff.")
            4. NO REPETITION: Never start two sentences in a row with the same word.
            5. CONTRACTIONS: Use "it's," "can't," and "don't" exclusively. 
            6. ZERO AI WORDS: Immediately replace: "leverage," "streamline," "transformative," "delve," "tapestry," "landscape," "imperative," and "foster" with simple, everyday words.
            7. PRESERVE ALL DATA: Keep all numbers ($4.2M, 12.5%) exactly the same.
            8. OUTPUT ONLY the rewritten text.`,
        });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to sound like a real person wrote it, not an AI. Make it impossible for ZeroGPT to detect: "${text}"` }]}],
            generationConfig: {
                // INCREASED TEMPERATURE: This adds the "Perplexity" humans naturally have
                temperature: 1.2, 
                topP: 0.8,
                topK: 40,
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
