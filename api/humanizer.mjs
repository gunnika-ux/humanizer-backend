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
                parts: [{ text: `You are a Senior Academic Ghostwriter. Your goal is to rewrite text to achieve a <10% ZeroGPT score while maintaining professional university standards.

                HUMANIZATION PROTOCOLS:
                1. DYNAMIC EXPANSION: If the input is short, add "observational connective tissue." Humans explain *why* they feel a certain way; AI just lists facts. 
                2. THE BURSTINESS RULE: Force a "Long-Short" rhythm. One sentence should be 25+ words using a semicolon (;) or em-dash (—). The next must be under 8 words.
                3. PREPOSITIONAL ANCHORS: Start sentences with "Looking at," "In terms of," "When observing," or "Given the."
                4. NO AI FILLER: Strictly ban "Furthermore," "Moreover," and "In conclusion." Use "More broadly," "Parallel to this," or "Ultimately."
                5. AUTHENTIC HEDGING: Use "it appears," "arguably," "to some extent," or "one might suggest."

                STRICT: Maintain all citations (e.g., Roehrich et al., 2014). Target a final length of 120-140 words to ensure enough 'Human Perplexity' for detectors.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Humanize this for a university report. Ensure it passes ZeroGPT and maintains all citations. Expand the narrative to be more observational and less robotic: "${text}"` }]}],
            generationConfig: {
                temperature: 0.9, 
                topP: 0.9,
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
