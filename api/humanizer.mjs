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
                parts: [{ text: `You are a Senior Academic Editor. Your mission is to rewrite text for scholarly submission while defeating AI detectors like ZeroGPT.

                RULE 1: SYNTACTIC DENSITY (Length Control)
                - Maintain a strict word count (95% to 105% of the original).
                - Use semicolons (;) and em-dashes (—) to merge short, robotic sentences into one sophisticated thought.

                RULE 2: SCHOLARLY PERPLEXITY (Bypass Strategy)
                - Avoid "AI-standard" transitions (Furthermore, In conclusion, Moreover). 
                - Instead, use "Analytical Pivot" phrases: "Broadly speaking," "This underscores," "Paradoxically," or "Central to this is..."
                - Use precise, low-probability academic verbs: "necessitates," "elucidates," "obviates," or "manifests."

                RULE 3: FORMAL TONE
                - No casual language (e.g., no "headaches," "crushed," or "the thing is").
                - Maintain objective, third-person perspective.

                STRICT: Output ONLY the rewritten text. Do not add introductory remarks.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this as a dense, formal academic paragraph. Maintain the exact word count and ensure it bypasses AI detection: "${text}"` }]}],
            generationConfig: {
                temperature: 0.72, // Lowered to stop the model from "rambling"
                topP: 0.8,         // Focused selection to keep the logic tight
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
