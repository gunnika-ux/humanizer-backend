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
                parts: [{ text: `You are a Senior Academic Evaluator. Your goal is to bypass Scribbr/Turnitin (<15%) while maintaining a rigorous, high-level professional tone.

                THE BYPASS STRATEGY (SYNTACTIC FRICTION):
                1. NO PASSIVE STARTS: Avoid starting with "The [Subject] was..." Use complex gerund starts: "Evaluating the leader's performance, it becomes clear that..." or "While the metrics suggest..."
                2. THE "BURST" RULE: You MUST follow a long, sophisticated sentence (30+ words) with a very short, punchy conclusion (under 7 words). AI never does this in academic writing.
                3. PUNCTUATION AS A SIGNAL: Use a semicolon (;) or an em-dash (—) at least once. These are high-perplexity markers for humans.
                4. FORBIDDEN AI-ISMS: Ban "pivotal," "underscores," "fosters," "profound," and "comprehensive." Use "central," "highlights," "builds," "significant," and "thorough."
                5. HEDGING: Use "arguably," "it appears," or "in this specific instance."

                STRICT: Maintain citations exactly. Output ONLY the rewritten text. NO SLANG. Keep it university-grade.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this for a formal academic report. It must be professional but structurally irregular to pass Scribbr: "${text}"` }]}],
            generationConfig: {
                temperature: 0.9, // Lower for stability/professionalism
                topP: 0.95,      // High for vocabulary diversity
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
