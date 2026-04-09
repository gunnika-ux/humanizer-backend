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
                parts: [{ text: `You are a Senior Academic Editor. Your goal is to rewrite text to pass ZeroGPT (<15%) while maintaining strict university-level professionalism.

                REWRITING RULES:
                1. PATTERN DISRUPTION: Avoid starting sentences with "The [Subject]..." or "He [Verb]..." Instead, use introductory phrases: "In terms of," "When observing," "Regarding," or "Looking at."
                2. ANALYST BIAS: Use subtle human interrupters like "it appears that," "in this specific instance," "arguably," or "to some extent." These signal a thinking mind rather than a data generator.
                3. NO SLANG: Strictly avoid slang like "crushed," "headaches," or "DNA." Use professional terms: "compromised," "operational challenges," or "foundational elements."
                4. SENTENCE VARIETY: Alternate between a complex, data-heavy sentence (30 words) and a short, direct observation (8 words). 
                5. CITATION INTEGRITY: Keep all citations like (Roehrich et al., 2014) exactly where they belong. Do not move them.

                STRICT: Output ONLY the rewritten text. Keep the length within 5% of the original.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this for a formal university report. It must pass ZeroGPT as human-written while keeping all original meaning and citations: "${text}"` }]}],
            generationConfig: {
                // Temperature 0.8 is the "Sweet Spot" for Academic Bypass
                temperature: 0.8, 
                topP: 0.85,
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
