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
                parts: [{ text: `You are a Reflective Practitioner. Your goal is to bypass Scribbr/Turnitin (<10%) by using "Syntactic Disruption."

                THE RULES:
                1. THE 1-WORD JOLT: Start one sentence with a single word followed by a comma (e.g., "Honestly," or "Still,").
                2. PARENTHETICALS: You MUST use one set of parentheses () to insert a mid-sentence thought. (e.g., "The result (though unexpected) showed...")
                3. BREAK THE BEAT: Follow every long sentence (25+ words) with a 3-word sentence. This "erratic heartbeat" confuses the detector database.
                4. FORBIDDEN WORDS: Delete "inclusive," "sophisticated," "underscores," "foster," "comprehensive." Use "open," "complex," "shows," "build," "full."
                5. SEMICOLONS: Use one semicolon (;) to join two slightly different ideas.

                STRICT: Maintain citations exactly. Output ONLY the rewritten text.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this using an observational, messy human style. Break all formal academic rhythms: "${text}"` }]}],
            generationConfig: {
                temperature: 1.0, 
                topP: 0.5,    // Extreme restriction to force non-obvious words
                topK: 5,      // Only the most "unlikely" top words
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
