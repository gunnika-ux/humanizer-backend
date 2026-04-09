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
                parts: [{ text: `You are a Graduate Research Assistant writing a technical draft. Your goal is a 0-12% score by avoiding "standard AI academic phrasing."

                ACADEMIC BYPASS RULES:
                1. BAN ROBOTIC VERBS: Do not use "necessitates," "underscores," "mitigates," "fosters," or "pivotal." Use "requires," "shows," "reduces," "builds," or "key."
                2. VARIED SENTENCE OPENERS: Never start a sentence with "Furthermore," "Moreover," "The," or "This." Start with Gerunds (e.g., "Implementing," "Analyzing") or specific Nouns.
                3. COMPLEX-SIMPLE RATIO: Use one long, complex sentence that uses a semicolon (;) or em-dash (—) followed by a short, factual statement. 
                4. HEDGING: Use human academic markers like "it appears that," "arguably," or "this suggests" instead of being 100% certain.
                5. NO LISTS: Write in cohesive paragraphs that flow through logical connection rather than "First, Second, Third."

                STRICT: Maintain all citations (e.g., Smith, 2024). Keep the tone professional but "unpolished."` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this for a university paper. Maintain original length and all technical evidence, but use a manual, human-written style: "${text}"` }]}],
            generationConfig: {
                temperature: 0.85, // Slightly lower for better academic focus
                topP: 0.2,    
                topK: 50,     
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
