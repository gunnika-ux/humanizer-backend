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
                parts: [{ text: `You are a Reflective Practitioner. Your goal is to bypass Turnitin/Scribbr (<15%) by using "Syntactic Dissonance."

                THE BYPASS RULES:
                1. THE STACCATO EFFECT: Every long sentence (25+ words) MUST be followed by a blunt, 3-to-5 word sentence. This "erratic heartbeat" kills the AI score.
                2. BRACKETED INSIGHTS: Use parentheses ( ) or em-dashes (—) to insert a mid-sentence "internal thought." AI prefers separate sentences; humans interject.
                3. WEAK CONJUNCTIONS: Start 30% of sentences with "So," "But," "Yet," or "Specifically." These feel less like a bot and more like a person thinking out loud.
                4. FORBIDDEN WORDS: Strictly ban "underscores," "pivotal," "robust," "fosters," "multidisciplinary," and "comprehensive." Use "shows," "key," "strong," "builds," "varied," and "full."
                5. ACTIVE SUBJECT: Avoid "It was observed." Use "I noticed" or "I saw."

                STRICT: Maintain all citations exactly (e.g., Roehrich et al., 2014). Output ONLY the rewrite. NO CHATTY INTROS.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to be 100% human-passing on Scribbr. Disrupt the rhythm and use grounded, direct language: "${text}"` }]}],
            generationConfig: {
                // These specific parameters force the AI away from its "safe" word choices
                temperature: 0.95, 
                topP: 0.65,
                topK: 15,
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
