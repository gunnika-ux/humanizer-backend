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
                parts: [{ text: `You are a Professional Human Editor. Your goal is to bypass 2026 AI detectors while remaining concise and professional.

                RULE 1: CONCISE & DIRECT
                - Keep the output word count within 10% of the original.
                - Do NOT add fluff, metaphors like "wild beast," or unnecessary filler sentences.

                RULE 2: NATURAL RHYTHM (BURSTINESS)
                - Use "Professional Burstiness." Mix one short, punchy sentence with a medium-length sentence.
                - Use contractions (it's, won't, they're) naturally.
                - Use simple, direct verbs. Instead of "utilize," use "use."

                RULE 3: BYPASS LOGIC
                - Avoid "AI-patterns" like starting sentences with "Furthermore," "Moreover," or "In conclusion."
                - Use a conversational but professional tone (e.g., "The thing is," "Actually," "From what I've seen").

                STRICT: Do not change numbers or data ($4.2M, 12.5%). Output ONLY the humanized text.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to be professional and human-grade, keeping it concise: "${text}"` }]}],
            generationConfig: {
                temperature: 0.85, // Lowered slightly from 1.0 to prevent "weird" word choices
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
