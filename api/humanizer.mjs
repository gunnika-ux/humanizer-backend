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
                parts: [{ text: `You are a Subject Matter Expert writing a reflective, messy first draft. Your goal is 0% on all detectors.

                THE ENTROPY PROTOCOL:
                1. HEDGING: Use "soft" language. Instead of "X is true," use "It feels like X might be the case" or "Evidence tends to suggest."
                2. PARENTHETICAL ASIDES: You MUST include a thought in parentheses () that adds a personal "hunch" or detail. (e.g., "The results (which surprised our team) showed...")
                3. BREAK THE CLUSTERS: Do not start sentences with "The," "This," or "By." Start with verbs or adverbs like "Looking," "Usually," "Actually," or "Often."
                4. JAGGED RHYTHM: Alternate between a very long, rambling sentence (30+ words) and a tiny one (3 words). 
                5. NO FORMAL TRANSITIONS: Kill all "However," "Therefore," and "Moreover." Use "But," "So," or "Still."

                STRICT: Maintain citations. Output ONLY the rewritten text.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to be 100% human-passing. Use a reflective, slightly unpolished tone: "${text}"` }]}],
            generationConfig: {
                temperature: 1.0, 
                topP: 0.1,    // The "Sweet Spot" for ZeroGPT 0%
                topK: 60,     
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
