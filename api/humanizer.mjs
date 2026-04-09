import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: "No text provided" });

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using 1.5 Flash for better stability on Free Tier

        const result = await model.generateContent({
            contents: [{ 
                role: "user", 
                parts: [{ text: `You are a Senior Academic Researcher. Rewrite this to have 0% AI detection. 
                
                RULES:
                1. No sentences starting with "The", "This", "Moreover", or "By".
                2. Use one 40-word sentence followed by one 4-word sentence.
                3. Replace "pivotal" and "mitigate" with "key" and "limit".
                4. Add a technical side-note in parentheses ().
                
                TEXT: "${text}"` }]
            }],
            generationConfig: {
                temperature: 0.9, 
                topP: 0.2, // Increased slightly to prevent the "500" logic crash
                topK: 40,
                maxOutputTokens: 2048,
            }
        });

        const output = result.response.text().trim();
        return res.status(200).json({ output });

    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({ error: "The API is overloaded or parameters are invalid. Try again." });
    }
}
