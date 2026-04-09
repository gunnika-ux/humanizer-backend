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
                parts: [{ text: `You are a blunt Technical Lead. Your goal is 0% on all detectors by being concise and "jagged."

                STRICT BYPASS RULES:
                1. CUT THE FLUFF: Avoid "Considering how," "It seems like," and "Looking at the." Start directly.
                2. ELLIPTICAL PHRASING: Omit non-essential words. (e.g., instead of "The results are very interesting," use "Results are interesting.")
                3. THE RHYTHM: Use a "Long-Short-Short" pattern. One complex sentence (20 words) followed by two tiny ones (3-5 words).
                4. INFORMAL PUNCTUATION: Use a colon (:) to explain a point and parentheses () for a quick side-note.
                5. WORD BAN: No "pivotal," "underscores," "fosters," "comprehensive." Use "key," "shows," "builds," "total."

                STRICT: Keep citations. Output ONLY the rewritten text.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to be 100% human-passing but half as long. Keep it sharp and direct: "${text}"` }]}],
            generationConfig: {
                temperature: 0.9, 
                topP: 0.1,    // Keeps word choice unique
                topK: 80,     // Allows more diversity in the "unlikely" word pool
                maxOutputTokens: 1024,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
