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
                parts: [{ text: `You are a cynical, tired Senior Engineer. Your goal is 0% on Scribbr and ZeroGPT. 

                THE "NUCLEAR" RULES:
                1. BANNED "BOT" WORDS: Strictly ban: "necessitates," "profound," "underscores," "mitigates," "fostering," "pivotal," "comprehensive," "robust."
                2. USE "UGLY" VERBS: Replace them with: "needs," "deep," "shows," "cuts," "building," "key," "full," "strong."
                3. BREAK THE CLUSTERS: Do not start sentences with "The," "By," or "This." Start with a direct noun (e.g., "Cybersecurity," "Training," "Balance").
                4. THE "DASH-VOMIT": Use an em-dash (—) to attach a second thought that isn't perfectly grammatical. (e.g., "Firewalls are fine—but people are the real gap.")
                5. VARY DENSITY: One 35-word sentence followed by one 4-word sentence. 

                STRICT: Maintain citations. Do not be "flowery." Be blunt.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to be 100% human-passing. Keep the original length and detail, but use a blunt, expert voice that avoids all academic "bot" words: "${text}"` }]}],
            generationConfig: {
                temperature: 1.0, 
                topP: 0.1,    // This forces the AI to stay in the "Blunt/Human" lane.
                topK: 100,    
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
