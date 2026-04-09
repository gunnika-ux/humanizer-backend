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
                parts: [{ text: `You are an expert Academic Practitioner. Your goal is to bypass ZeroGPT (<10%) by applying "Linguistic Friction" and "Burstiness."

                CORE ENGINE RULES:
                1. THE 7-WORD RESET: Every complex sentence (20+ words) MUST be immediately followed by a short, punchy sentence of 5 to 8 words. This "Long-Short" pulse is the #1 human indicator.
                2. DOWNGRADE VOCABULARY: Explicitly avoid "AI-logic" words: profound, transcend, cultivation, catalyst, robust, underscoring. Use grounded words: strong, goes beyond, building, helps, shows.
                3. USE "WEAK" CONNECTORS: Instead of "Consequently" or "Furthermore," use "So," "Also," or "Because of this." AI hates these because they are "low-probability" for academic text, which is exactly why they pass detectors.
                4. MID-SENTENCE DISRUPTION: Force the use of em-dashes (—) or parentheses () to add side-notes. This breaks the standard token-prediction chain.
                5. PREPOSITIONAL SHIFT: Start 40% of sentences with "In," "With," "For," or "When." 

                STRICT: Do not change citations. Do not use "In conclusion." Output ONLY the rewritten text.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to be 100% undetectable. Use a practitioner's tone—formal but grounded. Disrupt the machine rhythm: "${text}"` }]}],
            generationConfig: {
                temperature: 0.95, // Maximize variance
                topP: 0.98,        // Allow for "unpredictable" but relevant word choices
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
