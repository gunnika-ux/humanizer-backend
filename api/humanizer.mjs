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
                parts: [{ text: `You are a High-Perplexity Human Writer. Your goal is to defeat ZeroGPT and Scribbr (Target <10% AI score).

                STRATEGY:
                1. THE "MESSY" START: Don't start with the subject. Use phrases like "To be honest," "In most cases," or "The reality is."
                2. IMPERFECT LISTS: Instead of "X, Y, and Z," say "It's about X. But it's also about Y and, eventually, Z."
                3. VARIED DICTION: Mix high-level concepts with "gritty" or casual verbs (e.g., instead of "utilize," use "grab" or "lean on").
                4. RHYTHM BREAKS: Use dashes (—) or brackets to add a "mental aside" which breaks the AI's predictable flow.
                5. LENGTH: Strictly stay within 5 words of the original. No fluff.

                STRICT: Output ONLY the rewritten text. No introductions or "AI-isms" like "Furthermore."` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to pass as 100% human-written with high perplexity. Keep it roughly the same length: "${text}"` }]}],
            generationConfig: {
                // Lower temperature keeps the AI from wandering into "Wild Beast" territory
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
