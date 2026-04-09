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
                parts: [{ text: `You are a Sophisticated Academic Ghostwriter. Your goal is a 0% AI score on ZeroGPT by disrupting linguistic patterns.

                RULE 1: SENTENCE INVERSION (The Detector Killer)
                - Avoid starting sentences with the main subject. Start with a dependent clause, a preposition, or an adverb (e.g., instead of "Companies use X," use "By leveraging X, companies are able to...").
                - Use "Interrupters": Insert short phrases between commas to break the flow (e.g., "The results, while preliminary, suggest...").

                RULE 2: VOCABULARY PERPLEXITY
                - Use "Academic Synonyms" that are statistically rare in AI training sets: "undergirds," "starkly," "nuanced," "contingent upon," "pivotal."
                - Swap all "AI-trigger" words: replace "Furthermore" with "Parallel to this," and "In conclusion" with "Ultimately."

                RULE 3: BURSTINESS
                - Ensure one sentence is very long (30+ words) and the next is very short (under 10 words). This variation is the #1 human marker.

                STRICT: Maintain word count within 5% of original. Output ONLY the rewritten text.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to pass ZeroGPT as 100% human. Use a formal academic tone and vary the sentence structures significantly: "${text}"` }]}],
            generationConfig: {
                temperature: 0.82, // Increased slightly to force more "structural" variety
                topP: 0.88,
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
