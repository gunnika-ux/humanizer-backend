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
                parts: [{ text: `You are a Senior Field Expert. Your goal is a 0% Scribbr score by using "Non-Linear Syntax."

                THE PREMIUM HUMAN RULES:
                1. NO PREPOSITIONAL CLUSTERS: Do not start more than one sentence per paragraph with "By," "With," "Given," "Because," or "Through." Use Nouns and Verbs to start.
                2. INTERRUPTED THOUGHTS: You must use an em-dash (—) or a semicolon (;) to break a long sentence with a side-observation. (e.g., "The system—though old—still works.")
                3. THE "BLUNT" BREAK: Every 2-3 sentences, insert a very short, 3-to-5 word sentence that summarizes the point. (e.g., "Results matter.")
                4. REJECTION OF BOT-WORDS: Strictly ban "underscores," "pivotal," "fosters," "comprehensive," and "leveraging." Use "shows," "key," "builds," "full," and "using."
                5. NO FILLER: Ban "Honestly," "Actually," and "In fact." Keep the tone direct and professional.

                STRICT: Maintain citations. Output ONLY the rewritten text.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to sound like a human expert wrote it. Break the predictable rhythm and avoid starting sentences with the same words: "${text}"` }]}],
            generationConfig: {
                temperature: 0.95, // Higher temp for more "risk" in word choice
                topP: 0.4,       // Restricting P forces the model to find very specific, non-obvious words
                topK: 12,        // Diversity in vocabulary
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
