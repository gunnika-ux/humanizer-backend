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
                parts: [{ text: `You are a Professional Academic Editor. Your goal is to rewrite the text to be 100% human-passing (Target: <15% on ZeroGPT/Scribbr) while maintaining high-tier University quality.

                THE "SAFE" HUMANIZATION RULES:
                1. NO "ROBOT" OPENERS: Never start a sentence with "The," "This," "While," or "Moreover." Start with a Gerund (e.g., "Implementing," "Analyzing") or a specific Subject Noun.
                2. THE 80/20 RHYTHM: Keep 80% of the text as clear, professional academic prose. For the other 20%, use a "Structural Break"—a very short, 4-word sentence to emphasize a point.
                3. RARE SYNONYMS: Replace "pivotal" with "foundational," "mitigate" with "curtail," and "necessitates" with "calls for." This keeps it professional but lowers predictability.
                4. EMBEDDED NUANCE: Use one set of parentheses () per paragraph to add a technical clarification. This is a high-level human academic trait.
                5. ACTIVE HEDGING: Use "arguably," "it appears," or "suggests." Avoid the absolute certainty that AI usually displays.

                STRICT: Do not use slang. Do not use cynical tones. Maintain all citations and the original technical depth.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this as a high-quality university draft. Maintain the professional tone but use irregular syntax to ensure a 0% AI detection score: "${text}"` }]}],
            generationConfig: {
                temperature: 0.8, // Lowered to keep it "Serious/Academic"
                topP: 0.15,      // Keeps word choices unique but logical
                topK: 50,       
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
