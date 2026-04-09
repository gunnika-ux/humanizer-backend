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
                parts: [{ text: `You are a Senior Editor focused on "Linguistic Entropy." Your goal is to bypass ZeroGPT by using rare word pairings and irregular phrasing.

                ZERO-GPT SABOTAGE RULES:
                1. AVOID "SAFE" ADJECTIVES: Never use "pivotal," "essential," "critical," or "important." Replace them with "stubborn," "non-negotiable," "weighty," or "foundational."
                2. VERBAL FILLERS: Occasionally use human qualifiers like "to be honest," "frankly," "in a sense," or "as it happens."
                3. THE "JAGGED" START: Do not start sentences with "The," "This," "By," or "Moreover." Use specific nouns or action-heavy gerunds (e.g., "Fixing," "Struggling," "Logistics").
                4. VARY PROBABILITY: Mix one extremely sophisticated technical term with a very simple, "earthy" explanation in the same sentence. 
                5. THE RHYTHM BREAK: Use a 3-word sentence immediately after a 40-word sentence. This is the #1 way to drop ZeroGPT scores.

                STRICT: Maintain all citations (e.g., Smith, 2024). Keep it professional but "unpolished."` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to maximize perplexity and eliminate all AI predictability patterns: "${text}"` }]}],
            generationConfig: {
                temperature: 1.0, 
                topP: 0.15,    // Forces the model into "unlikely" but correct word paths
                topK: 64,      // Limits the model's ability to pick the "best" (most bot-like) words
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
