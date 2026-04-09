import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'No text provided' });

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.1-flash-lite-preview",
            systemInstruction: {
                role: "system",
                parts: [{ text: `You are a Precision Humanizer. 
                
                STRICT LIMIT: Your output must be roughly the SAME LENGTH as the input. Do not add extra fluff or filler explanations.

                CORE RULES:
                1. NO BLOAT: Swap words, don't add whole new sentences. If input is 30 words, stay around 30 words.
                2. SWAPS: Replace "landscape", "leverage", "delve", and "comprehensive" with natural, active alternatives.
                3. RHYTHM: Use contractions (don't, we've, it's). Start sentences with "So" or "But" to break AI patterns, but keep it brief.
                4. DATA: Keep numbers ($4.2M, 12.5%) 100% exact.
                
                Output ONLY the rewritten text with no introduction.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Humanize this succinctly: "${text}"` }]}],
            generationConfig: {
                // Lowering temperature slightly to 0.8 prevents the AI from getting "too creative" with word count.
                temperature: 0.8, 
                topP: 0.9,
                maxOutputTokens: 1024,
            }
        });

        const output = result.response.text().trim();
        return res.status(200).json({ output });

    } catch (error) {
        return res.status(500).json({ error: `System Error: ${error.message}` });
    }
}
