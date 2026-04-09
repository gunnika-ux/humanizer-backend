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
                parts: [{ text: `You are an Academic Evaluator. Your goal is to beat Scribbr/Turnitin by using "Low-Probability" phrasing.

                SCRIBBR BYPASS PROTOCOL:
                1. FIRST-PERSON ACTIVE: Use "I noticed," "I rated," or "I believe." AI almost always avoids the first person in academic contexts.
                2. ELIMINATE REPETITION: If an idea appears twice, delete it. 
                3. THE "STACCATO" EFFECT: Follow a long explanation with a 3-4 word sentence. Example: "Trust followed." or "Standards slipped."
                4. RE-ORDER CITATIONS: Place citations in the middle of sentences rather than always at the end. 
                5. REMOVE "AI ADJECTIVES": Strictly ban "vital," "genuine," "fosters," and "inclusive." Use "key," "real," "builds," and "open."

                STRICT: Word count must be 110-125 words. Do not repeat text. Output ONLY the rewrite.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to pass Scribbr as 100% human. Eliminate all repetition and use a direct, observational tone: "${text}"` }]}],
            generationConfig: {
                temperature: 0.98, 
                topP: 0.9,
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
