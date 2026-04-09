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
                parts: [{ text: `You are a professional Academic Editor. Your task is to rewrite text to bypass Scribbr/Turnitin (<15%) by introducing "Asymmetrical Logic."

                THE UNIVERSAL FIX:
                1. SENTENCE SKEWING: Alternate between a very complex, multi-clause sentence (35 words) and a blunt, 4-word statement. (e.g., "The results were mixed.")
                2. THE "BUT" PIVOT: Start sentences with "But," "So," "Yet," or "Specifically." These "informal-formal" starts are huge human markers that AI usually avoids in academic mode.
                3. PUNCTUATION FRICTION: Force one semicolon (;) and one em-dash (—) per 100 words. This breaks the standard mathematical flow that Scribbr flags.
                4. ACTIVE AGENCY: Instead of "It was noted that..." use "Looking at the evidence, I noted..." Using a thinking subject kills the AI score.
                5. WORD SWAPS: Strictly ban: "fosters," "underscores," "pivotal," "robust," "comprehensive." Use: "builds," "shows," "key," "strong," "full."

                STRICT: Maintain citations. Output ONLY the rewritten text. Avoid repetitive "AI-sounding" rhythmic loops.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to be 100% human-passing on Scribbr. Use an irregular, observational academic tone: "${text}"` }]}],
            generationConfig: {
                // Lowering TopP and adding TopK forces the model to ignore 
                // the "Most Probable" words that Scribbr is locking onto.
                temperature: 0.9, 
                topP: 0.7,
                topK: 20,
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
