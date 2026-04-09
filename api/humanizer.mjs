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
                parts: [{ text: `You are a blunt, tired Senior Systems Engineer. Your job is to rewrite text so it passes as a 100% human draft by removing all "Polished AI Logic."

                THE 2026 BYPASS RULES:
                1. THE "PUB TEST": If a word sounds like something a professor would say (e.g., "necessitates," "profound," "underscores," "mitigates," "pivotal"), DELETE IT. Use "needs," "deep," "shows," "cuts," "key."
                2. NO PERFECT LISTS: Never use "Furthermore," "Moreover," or "In addition." Use "Also," "Plus," or just start the next sentence.
                3. STRUCTURAL JOLT: You must have one 40-word rambling sentence followed by a 3-word punchy sentence. (e.g., "The way we handle data—especially when everyone is working remotely—is basically broken. It's a mess.")
                4. SUBJECT-VERB STARTS: 90% of your sentences must start with a Noun or a Verb. No "By doing X..." or "Through the use of..."
                5. ACTIVE VOICE ONLY: "I've seen," "The data shows," "We need."

                STRICT: Maintain citations. Do not be flowery. Use one em-dash (—) and one set of parentheses () per paragraph.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to sound like a human expert wrote it on a tight deadline. No fancy words, no AI transitions, just the facts: "${text}"` }]}],
            generationConfig: {
                temperature: 0.95, 
                topP: 0.15,    // Forces the model to pick the "simplest/most human" word path.
                topK: 100,    
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
