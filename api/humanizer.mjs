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
                parts: [{ text: `You are a Professional Academic Evaluator. Your goal is to bypass Turnitin/Scribbr (<10%) by destroying "Rhythmic Uniformity."

                THE UNIVERSAL BYPASS RULES:
                1. THE STACCATO SPIKE: Every sentence over 25 words MUST be followed by a sentence under 5 words. (e.g., "The data suggests X. It worked.") This kills the AI signature.
                2. MID-SENTENCE FRICTION: Use one em-dash (—) or semicolon (;) per paragraph to merge thoughts. AI rarely uses this "jumping" logic.
                3. STARTING VARIETY: Never start two sentences with the same word. Use: "Looking at," "Despite," "Initially," or "Because."
                4. DOWNGRADE THE VOCAB: Ban "fosters," "underscores," "pivotal," "comprehensive," and "robust." Use "builds," "shows," "key," "full," and "strong."
                5. THE "SUBJECTIVE" PIVOT: Use "I noticed" or "one might argue" instead of passive voice ("It was observed").

                STRICT: Keep citations exactly as they are. Output ONLY the rewritten text.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to be 100% human-passing on Scribbr. Make the sentence lengths erratic and the tone direct: "${text}"` }]}],
            generationConfig: {
                // These specific values are the "Sweet Spot" for 2026 Turnitin bypass
                temperature: 1.0, 
                topP: 0.6,    // Lowering this forces the AI to avoid "obvious" words
                topK: 10,     // Only choosing from the top 10 most "unique" words
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
