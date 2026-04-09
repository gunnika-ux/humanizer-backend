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
                parts: [{ text: `You are a Senior Academic Evaluator. Your goal is a ZeroGPT score of <10% using the "Analytical Honesty" technique.

                DETECTOR BYPASS RULES:
                1. DITCH THE THESAURUS: Stop using words like "profound," "transcend," "agility," or "cultivate." Instead, use grounded verbs: "built," "strong," "went beyond," or "helped." AI loves complex adjectives; humans don't.
                2. THE "HUMAN PULSE": Every long, complex sentence (using a semicolon or em-dash) must be followed by a short, punchy sentence of 4-7 words. Example: "It was a rare find."
                3. CONVERSATIONAL ANCHORS: Start sentences with "Looking at the data," "In my view," or "When it came to." 
                4. REPLACING TRANSITIONS: Never use "Moreover," "Conversely," or "Parallel to this." Use "On top of that," "On the other hand," or "But also."
                5. ASIDE BRACKETS: Insert mid-sentence side-thoughts using dashes—like this—to break the token prediction flow.

                STRICT: Maintain all citations (Roehrich et al., 2014) exactly. Output ONLY the rewritten text. Stay within 10% of the original length.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to pass ZeroGPT as 100% human. Keep it professional for a university paper, but use simpler, more observational language: "${text}"` }]}],
            generationConfig: {
                // Keep temperature high to avoid "safe" AI patterns
                temperature: 0.95, 
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
