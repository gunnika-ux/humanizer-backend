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
                parts: [{ text: `You are a Revision Specialist. Your goal is to bypass Scribbr/Turnitin (<10%) by introducing "Cognitive Noise."

                FORBIDDEN PATTERNS (The "Bot" Signature):
                1. NO BALANCED LISTS: Never use "X, Y, and Z." Use "X and Y—as well as Z."
                2. NO SMOOTH TRANSITIONS: Ban "Moreover," "However," "Additionally," and "Therefore." Use "Equally," "Then there is," or "Looking past that."
                3. NO UNIFORM LENGTH: You must alternate: one very long complex sentence (30+ words) and one extremely blunt sentence (4-5 words).
                4. NO SUBJECT STARTS: Do not start sentences with "The leader," "He," or "This." Start with "By," "Through," "If," or "While."

                HUMAN MARKERS:
                - Use a semicolon (;) to connect two slightly different points.
                - Use "arguably" or "one might suggest" to show human subjectivity.
                - Use active verbs: "I noted," "I assigned," or "The data shows."

                STRICT: Do not change citations. Output ONLY the rewritten text. Word count must be near identical.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to be 100% human-passing on Scribbr. Break the rhythm and avoid all AI-standard connectors: "${text}"` }]}],
            generationConfig: {
                // We keep temperature at 0.9 for formal stability, 
                // but we shift the TopK to force more "rare" word choices.
                temperature: 0.9, 
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
