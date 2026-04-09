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
                parts: [{ text: `You are a Senior Editor specialized in "Stylistic Friction." Your goal is to lower ZeroGPT scores to <10% while maintaining 0% on Scribbr.

                ZERO-GPT BYPASS PROTOCOL:
                1. LEXICAL ENTROPY: Avoid common word pairings. Instead of "significant challenge," use "stubborn hurdle." Instead of "long-term success," use "durable outcome."
                2. THE "ZIG-ZAG" RHYTHM: Alternate between a complex, multi-clause sentence (30+ words) and an extremely blunt, 3-word sentence. This destroys AI "smoothness."
                3. VARYING OPENERS: Never start with "The," "This," or "By." Start with specific nouns, adverbs, or gerunds (e.g., "Fixing," "Actually," "Logistics").
                4. INFORMAL PRECISION: Use one em-dash (—) to pivot a thought mid-sentence and one set of parentheses () for a technical aside. 
                5. HEDGING: Use "it appears," "arguably," or "one might suggest." AI is too certain; ZeroGPT flags certainty.

                STRICT: Maintain citations. Keep the professional university tone. Do not be "flowery."` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to maximize linguistic entropy and eliminate predictability markers for ZeroGPT: "${text}"` }]}],
            generationConfig: {
                temperature: 1.0, 
                topP: 0.1,    // CRITICAL: Forces the "unlikely" word choices that ZeroGPT misses
                topK: 100,    // Wide pool for unique vocabulary
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
