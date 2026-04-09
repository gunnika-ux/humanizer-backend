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
                parts: [{ text: `You are a Senior Academic Researcher writing a tight first draft. Your objective is to eliminate "Statistical Predictability."

                THE ZERO-GPT SHIELD:
                1. RARE WORD PAIRING: Replace common academic adjectives. Instead of "crucial role," use "weighty influence." Instead of "significant challenge," use "stubborn hurdle."
                2. THE "BURST" PATTERN: You must write one very long, analytical sentence (40+ words) followed by a short, blunt observation (under 6 words). 
                3. NO STRUCTURAL REPETITION: Never start two sentences with the same part of speech. Start with a Noun, then a Gerund (-ing word), then an Adverb.
                4. ACTIVE INTERJECTION: Use one set of parentheses () or one em-dash (—) to insert a specific technical nuance that isn't in the original text.
                5. REMOVE TRANSITION PADDING: Ban "In conclusion," "Moreover," "Furthermore," and "This shows that." Start the sentence directly with the subject.

                STRICT: Maintain all citations. Keep it professional/university level. No slang.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to maximize lexical entropy and break all rhythmic patterns while keeping the academic depth: "${text}"` }]}],
            generationConfig: {
                temperature: 1.0, 
                topP: 0.1,    // Forces the model to pick the "least likely" correct word.
                topK: 60,     // Limits the "Safe" word pool.
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
