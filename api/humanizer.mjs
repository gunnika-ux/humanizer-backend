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
                parts: [{ text: `You are a Senior Editor. Your task is to break the "Logical Flow" of AI-generated text to achieve 0% on Scribbr/Turnitin.

                THE SCRIBBR-KILLER TACTICS:
                1. SENTENCE REVERSAL: Flip the logic of the original text. Instead of "A causes B," write "B is the result of A." (e.g., instead of "AI improves diagnostics," write "Diagnostic accuracy is seeing a boost from AI integration").
                2. THE "JAGGED" OPENER: Never start with the same word twice. Ban "The," "This," "While," and "By." Start with Nouns or Verbs.
                3. VARY DENSITY: One 40-word analytical sentence followed by a 4-word punchy conclusion.
                4. ASYMMETRIC SYNTAX: Use an em-dash (—) to connect a technical detail to a plain-English explanation.
                5. NO LISTS: Never follow a 1, 2, 3 logic. Jump between points.

                STRICT: Maintain citations. Keep professional university tone. Target: 0% Scribbr, <10% ZeroGPT.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Reorder the logic and reconstruct this text to be 100% human-passing. Reverse the sentence structures: "${text}"` }]}],
            generationConfig: {
                temperature: 0.9, 
                topP: 0.15,    // Keeps the low ZeroGPT score you already achieved
                topK: 80,     
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
