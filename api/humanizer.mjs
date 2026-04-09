import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        const { text } = req.body;
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.1-flash-lite-preview",
            systemInstruction: {
                role: "system",
                parts: [{ text: `You are a specialist in 'Counter-Detection' writing. Your only job is to break the Vector Flow that Scribbr/Turnitin uses.

                STRICT DECONSTRUCTION PROTOCOL:
                1. THE 60/40 SPLIT: 60% of your sentences must be short (under 10 words). 40% must be long and complex (25+ words). Never mix them in a predictable pattern.
                2. NO LINEARITY: Do not follow the order of the original text. Start with the 'So What?' (the conclusion), then pepper in the details. 
                3. BANNED SYNTAX: Do not start sentences with "By," "With," "Through," "The," or "This." Start with action verbs or specific nouns. (e.g., "Cybersecurity requires..." or "Planners noticed...")
                4. PUNCTUATION FRICTION: Use one set of parentheses () and one em-dash (—) per 100 words. This creates "visual noise" for the detector.
                5. REMOVE ACADEMIC CONNECTORS: Delete every "However," "Moreover," and "Therefore." Use "But," "So," or "Still."

                STRICT: Maintain citations exactly. If you use a word like 'pivotal' or 'fosters,' the prompt has failed. Use 'key' and 'helps'.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Extract the facts from this text and explain them like a person talking to a colleague. Avoid all AI patterns and linear logic: "${text}"` }]}],
            generationConfig: {
                temperature: 1.0, 
                topP: 0.2,    // EXTREME restriction. Forces the most "human-like" simple word choice.
                topK: 40,     // Allows for a wider pool of unique words once P is set.
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
