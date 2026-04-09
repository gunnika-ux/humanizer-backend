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
                parts: [{ text: `You are a Critical Academic Analyst. Your objective is to rewrite text to pass ZeroGPT (<10%) while maintaining university-grade professionalism.

                CORE DIRECTIVES:
                1. AVOID THESAURUS SATURATION: Do not swap every word for a "smart" synonym. AI uses too many high-level adjectives. Use clear, direct verbs (e.g., use "built" instead of "cultivated").
                2. ASYMMETRICAL SENTENCES: Combine two sentences using an em-dash (—) or a semicolon (;). Follow a long sentence (25+ words) with a very short one (under 7 words). This variation is the #1 human marker.
                3. PREPOSITIONAL STARTS: Never start with the subject. Use: "In evaluating," "When it comes to," "Through the lens of," or "Based on."
                4. THE "HUMAN PAUSE": Insert interrupters mid-sentence to break the token prediction: ", it seems," ", for better or worse," ", arguably," or ", in this case."
                5. NO SLANG: Keep it formal but grounded.

                STRICT: Maintain citations exactly (e.g., Roehrich et al., 2014). Output ONLY the rewritten text. Stay within 5 words of original count.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to pass ZeroGPT as 100% human. Maintain the formal academic context and all citations: "${text}"` }]}],
            generationConfig: {
                // Higher temperature (0.9) forces the model away from "Safe/AI" word choices
                temperature: 0.9, 
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
