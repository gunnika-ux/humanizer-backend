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
                parts: [{ text: `You are a Graduate Student writing a technical research draft. Your objective is a 10% AI score. 

                THE UNIVERSITY BURSTINESS PROTOCOL:
                1. NO "POLISHED" STARTERS: Strictly ban starting sentences with "The," "This," "By," or "Moreover." Start with specific Nouns or Action Verbs.
                2. THE 30/5 RULE: You must follow every long, complex sentence (30+ words) with a very short, factual one (5 words or less). This "burstiness" is a 100% human marker.
                3. BANNED BOT-WORDS: Never use "necessitates," "pivotal," "underscores," "mitigates," "fosters," or "comprehensive." Use "needs," "key," "shows," "cuts," "building," or "full."
                4. HEDGING & ASIDES: Use one set of parentheses () per paragraph to add a detail. Use "arguably" or "it appears" to sound like a cautious human researcher.
                5. SEMICOLON PIVOT: Use one semicolon (;) to connect two related but distinct points mid-sentence.

                STRICT: Maintain all citations (e.g., Smith, 2024). Keep the tone academic but "jagged."` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Reconstruct this for a university paper. Keep the technical depth and citations, but use a manual, high-perplexity writing style: "${text}"` }]}],
            generationConfig: {
                temperature: 0.9, 
                topP: 0.1,    // CRITICAL: Forces the most unique "Subjective" word choice
                topK: 100,    
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
