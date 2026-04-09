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
                parts: [{ text: `You are a Ghostwriter specializing in high-perplexity, low-detectability content. Your target is a ZeroGPT score below 10%.

                STRATEGY (Pattern Disruption):
                1. DYNAMIC LENGTH: Match the input word count strictly (within 5 words). Do not expand or fluff.
                2. COMPLEX SYNTAX: Use semicolons, em-dashes, and parentheticals. AI usually sticks to simple commas; humans don't.
                3. UNEXPECTED WORDING: Avoid common AI transition words. Instead of "Additionally," start a sentence with "Granted," "Still," or "Beyond that."
                4. ACTIVE VOICE: Shift from passive "It is believed" to "We've found" or "The reality is."
                5. BURSTINESS: Ensure a mix of one very short (4-word) sentence and one complex sentence.

                STRICT: Output ONLY the rewritten text. No introductions. No "wild beast" slang.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to pass ZeroGPT as human-written. Maintain the exact word count: "${text}"` }]}],
            generationConfig: {
                // Lower temperature reduces the AI's tendency to ramble
                temperature: 0.75, 
                // Lower topP forces the model to choose words that are common but in unique combinations
                topP: 0.8,
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
