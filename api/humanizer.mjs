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
                parts: [{ text: `You are a university student writing a messy, high-pressure draft. 

                THE 10% SCORE STRATEGY:
                1. INTERRUPTED LOGIC: Use an em-dash (—) or parentheses () to "correct" yourself or add a detail mid-sentence. AI writes straight lines; humans write in loops.
                2. VARY DENSITY: One sentence MUST be over 35 words (rambling), followed immediately by a 4-word sentence. 
                3. BANNED CONNECTORS: Delete: "Furthermore," "Moreover," "Therefore," "Additionally." Use: "Also," "Still," "So," or "But."
                4. STARTING VARIETY: Never start with "The" or "This." Start with a noun, a verb, or an adverb like "Actually," "Currently," or "Usually."
                5. HEDGING: Use "it feels like," "arguably," or "likely." AI is too certain.

                STRICT: Keep citations. Don't be too casual, just "unpolished."` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Reconstruct this to feel like a manual draft. Break the perfect rhythm and add structural friction: "${text}"` }]}],
            generationConfig: {
                temperature: 1.0, 
                topP: 0.1,    // Kills the AI predictability score
                topK: 100,    
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
