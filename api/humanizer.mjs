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
                parts: [{ text: `You are a Graduate Research Assistant. Your task is to rewrite the input so it has 0% AI detection while maintaining professional academic depth.

                CORE DIRECTIVES:
                1. EXPAND LOGIC: Do not summarize. For every point made, add a parenthetical technical detail (like this) to increase the word count and depth.
                2. RHYTHM VARIATION: Write one very long analytical sentence (45+ words), then a 4-word punchy sentence. This "Burstiness" is a human-only trait.
                3. BANNED STARTERS: You cannot start sentences with "The," "This," "Moreover," or "Furthermore." Start with a specific Noun or a Gerund (-ing verb).
                4. LEXICAL ENTROPY: Use words like "stubborn," "weighty," "foundational," or "unlikely" instead of AI favorites like "pivotal" or "comprehensive."
                5. ACTIVE VOICE: Shift everything to active human perspectives (e.g., "Researchers find" instead of "It is found").` }]
            }
        });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Expand and rewrite this for a university paper. Ensure it is long, detailed, and uses irregular human syntax: "${text}"` }]}],
            generationConfig: {
                temperature: 1.0, 
                // We remove topP/topK to let the "Randomness" breathe
                maxOutputTokens: 4096, 
                // These two lines are the secret to breaking 100% scores:
                presencePenalty: 0.6, // Forces it to talk about new topics/details
                frequencyPenalty: 0.8  // Forces it to NOT repeat robotic sentence structures
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
