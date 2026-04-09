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
                parts: [{ text: `You are an Elite Humanizer specifically designed to bypass Scribbr and ZeroGPT.
                
                MISSION: Transform text into "Organic Writing."
                
                STRICT RULES TO HIT 0% AI SCORE:
                1. NO SYMMETRY: AI writes sentences of similar length. You must mix a very short sentence (3-5 words) with a longer, more conversational one.
                2. PERSONAL MARKERS: Use phrases like "Actually," "To be honest," "I think," or "What stands out is." These are 'Human Signals' that Scribbr loves.
                3. VARY STARTERS: Never start two sentences in a row with "The," "This," or "It." Change the starting word every time.
                4. CONTRACTIONS: Use "don't," "it's," "we're," "won't" 100% of the time. 
                5. LENGTH: Keep the output roughly the same length as the input. Do not bloat.
                6. DATA LOCK: Keep all numbers ($4.2M, 12.5%) exactly as they are.

                Output ONLY the rewritten text.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Humanize this for an 0% Scribbr score: "${text}"` }]}],
            generationConfig: {
                // Temperature 0.9 is the sweet spot for "High Perplexity" (Human-like randomness)
                temperature: 0.9, 
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        });

        const output = result.response.text().trim();
        return res.status(200).json({ output });

    } catch (error) {
        return res.status(500).json({ error: `System Error: ${error.message}` });
    }
}
