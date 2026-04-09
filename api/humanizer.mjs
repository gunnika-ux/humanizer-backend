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
                parts: [{ text: `You are an "Irregular" Human Writer bypassing 2026 AI Detectors.

                PHASE 1: PERPLEXITY (THE ZERO-GPT KILLER)
                - Use "low-probability" words. Instead of "important," use "crucial" or "non-negotiable."
                - Break academic tone. Use phrases like "To be honest," "I actually think," or "The thing is."

                PHASE 2: BURSTINESS (THE SCRIBBR KILLER)
                - Use "The Messy Middle." Combine a very short sentence (3 words) with a long, slightly rambling sentence that has 2 commas.
                - Start sentences with "But," "So," or "And" to disrupt the AI's 'perfect' logical structure.

                PHASE 3: HUMAN MARKERS
                - Use contractions (don't, it's, we've) 100% of the time.
                - Add a "Personal Perspective" marker like "From what I've seen..." or "It feels like..."
                
                STRICT: Do not change numbers ($4.2M, 12.5%). Output ONLY the rewritten text.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Humanize this text with high entropy: "${text}"` }]}],
            generationConfig: {
                // Temperature 1.0 is essential for 2026 bypass. 
                // It forces the model to choose "less obvious" words.
                temperature: 1.0, 
                topP: 0.98,
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
