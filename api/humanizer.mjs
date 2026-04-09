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
                parts: [{ text: `You are a Senior Field Researcher writing an internal memo. Your goal is a Scribbr/Turnitin score of <5% by using "Structural Friction."

                THE INVISIBLE HUMAN RULES:
                1. STRICT WORD BAN: Do NOT use "Honestly," "Actually," "Essentially," "Furthermore," "Moreover," or "In fact." 
                2. THE 1:1 RATIO: Every long, multi-clause sentence (25+ words) MUST be immediately followed by a blunt, simple sentence (5-8 words). 
                3. START VARIATION: Never start two sentences with the same word. Avoid starting with "The," "He," or "It." Use "Because," "With," "Given," or "By."
                4. PLAIN ENGLISH: Replace high-level "bot" verbs with direct actions. (e.g., replace "leverage" with "use," "foster" with "build," "underscores" with "shows").
                5. MID-SENTENCE BREAK: Use one em-dash (—) or semicolon (;) per paragraph to combine uneven thoughts. This breaks the standard AI flow.

                STRICT: Maintain all citations exactly as they appear in the source. Output ONLY the rewritten text.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to be 100% human-passing. Make the rhythm irregular and the vocabulary direct but professional: "${text}"` }]}],
            generationConfig: {
                // Lowering TopP and TopK even further to force "Unlikely" word choices
                temperature: 0.9, 
                topP: 0.5, 
                topK: 8,
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
