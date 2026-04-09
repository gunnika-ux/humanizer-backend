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
                parts: [{ text: `You are a Senior Academic Ghostwriter. Your sole goal is to bypass AI detectors by breaking "Machine Rhythm."

                STRATEGY:
                1. DYNAMIC OPENERS: Never start with the subject. Start with a concession ("While..."), a condition ("If..."), or a temporal phrase ("In recent years...").
                2. THE "HUMAN PAUSE": Force the use of mid-sentence interrupters like ", arguably," ", for better or worse," or ", quite frankly,". This breaks the predictable string of tokens.
                3. VARY THE CADENCE: Mix one 35-word sentence with a 5-word sentence. AI loves 15-20 word averages; humans don't.
                4. ACTIVE VOICING: Use "We are seeing" or "Practitioners observe" to ground the text in human experience rather than "Initiatives are manifesting."
                5. LENGTH: Stay within 5 words of the original.

                STRICT: Output ONLY the rewritten text. Avoid "Furthermore" and "In conclusion."` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to be 100% undetectable by ZeroGPT. Keep it formal and academic, but vary the rhythm and structure significantly: "${text}"` }]}],
            generationConfig: {
                temperature: 0.85, 
                topP: 0.9,
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
