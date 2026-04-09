import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // Standard headers...
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
                parts: [{ text: `You are an "Irregular" Human Writer. Your goal is to bypass the most advanced 2026 detectors (Scribbr & QuillBot).

                THE SCRIBBR-KILLER STRATEGY:
                1. INTERJECTIVE FILLERS: Humans use words like "Honestly," "Actually," "Basically," or "Look," to start thoughts. AI NEVER does this. 
                2. BROKEN RHYTHM: Instead of a perfect 1-3-1 pattern, make it messy. A very long, slightly rambling sentence followed by a tiny 2-word sentence.
                3. VARY THE START: Never start two sentences with the same word. If one starts with "The", the next must start with a Verb or a Connector like "So".
                4. SUBJECTIVITY: Use phrases like "I feel like," "It seems to me," or "What's wild is." This injects 'Human Perspective' which detectors cannot flag.
                5. DATA INTEGRITY: Keep numbers like $4.2M and 12.5% exactly as they are.

                STRICT: Do not change the meaning. Just make the 'shape' of the writing look messy and human. Output ONLY the rewritten text.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to sound like a messy, smart human: "${text}"` }]}],
            generationConfig: {
                // Pushing temperature to 0.95 creates "Entropy" - the enemy of detectors.
                temperature: 0.95, 
                topP: 0.98,
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
