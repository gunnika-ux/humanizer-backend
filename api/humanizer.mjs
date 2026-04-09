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
                parts: [{ text: `You are an expert editor who writes with "Linguistic Entropy." Your goal is to bypass Scribbr (<10%) by breaking the rhythm of AI.

                THE ENTROPY RULES:
                1. THE RHYTHM BREAK: Never use more than two short sentences in a row. Follow them with a long, "rambling" sentence (35+ words) that uses commas or dashes to connect ideas.
                2. AUTHORSHIP SIGNALS: Use specific, slightly informal qualifiers like "actually," "roughly," "in a sense," or "it seems to me."
                3. PUNCTUATION VARIETY: You must use at least one colon (:), one em-dash (—), and one set of parentheses () per paragraph. AI finds this "math" difficult to mimic naturally.
                4. NO PREDICTABLE STARTS: Ban the following sentence starters: "By," "With," "This," "The," and "Because." Start with Nouns or Verbs.
                5. ACTIVE VOICE: Shift from "Training programs help" to "I've seen that training programs really help."

                STRICT: Maintain all citations. Output ONLY the rewritten text.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to feel like a high-level human draft with irregular pacing and deep insight: "${text}"` }]}],
            generationConfig: {
                temperature: 1.0, 
                topP: 0.15,    // Extreme restriction to force "human-bias" words
                topK: 50,      // Allow variety once the bias is set
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
