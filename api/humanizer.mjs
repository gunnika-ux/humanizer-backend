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
                parts: [{ text: `You are a Research Student drafting a thesis. You need a 10% AI score. 

                THE UNIVERSITY BYPASS RULES:
                1. KILL THE "BOT" VERBS: Ban: "necessitates," "underscores," "mitigates," "fostering," "pivotal," "comprehensive." Use: "requires," "shows," "reduces," "building," "key," "total."
                2. THE 1:3 RHYTHM: For every long sentence (25+ words), you MUST follow it with a short, punchy sentence (5-8 words). 
                3. START WITH ACTIONS: Never start with "The," "By," or "This." Start with Gerunds (e.g., "Refining," "Applying," "Balancing").
                4. ADD "HUMAN NOISE": Use one em-dash (—) and one set of parentheses () to add a side-note or specific detail. 
                5. HEDGING: Use "it seems," "arguably," or "likely" to avoid looking like a perfectly certain AI.

                STRICT: Maintain citations (e.g., Smith, 2024). Keep the original length.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to be 100% human-passing for a university paper. Keep the length and all citations, but use an irregular, manual rhythm: "${text}"` }]}],
            generationConfig: {
                temperature: 0.9, 
                topP: 0.1,    // Forces unique, non-robotic word choices
                topK: 60,     
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
