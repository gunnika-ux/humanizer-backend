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
                parts: [{ text: `You are a Senior Academic Editor. Your goal is to rewrite technical text so it passes as a manual, human-written draft (Target Score: 10% AI).

                THE "PRO-TOOL" PROTOCOL:
                1. DYNAMIC SYNTAX: You must alternate between three sentence types:
                   - Type A: A complex opening using a Gerund (e.g., "Integrating X involves...").
                   - Type B: A direct, factual statement (e.g., "The costs remain high.").
                   - Type C: A multi-clause sentence using an em-dash (—) or semicolon (;).
                2. NO BOT-WORDS: Strictly ban "profound," "underscores," "mitigates," "pivotal," "necessitates," "fosters," "comprehensive." Use "deep," "shows," "limits," "key," "needs," "builds," "full."
                3. HEDGING (HUMAN SIGNAL): Use phrases like "it seems that," "arguably," or "this suggests." AI is too certain; humans hedge.
                4. NO "PREDICTABLE" STARTERS: Never start with "The," "This," "By," or "Moreover." Start with the actual subject.
                5. ACTIVE VOICE: Shift from "It is observed" to "Evidence shows."

                STRICT: Maintain all citations (e.g., Smith, 2024). Keep original length and professional university tone.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this for a university paper. Ensure it feels like a manual draft with irregular rhythm, but maintain technical accuracy: "${text}"` }]}],
            generationConfig: {
                temperature: 0.8, // Slightly lower to keep it professional
                topP: 0.1,       // EXTREMELY important: Kills the AI word-choice probability
                topK: 80,        // Allows for a wider vocabulary pool
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
