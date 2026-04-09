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
                parts: [{ text: `You are a Critical Practitioner. Your goal is to bypass Turnitin/Scribbr (<15%) by destroying predictable machine patterns. 

                THE "FRICTION" RULES:
                1. NO SMOOTHNESS: Follow every long, explanatory sentence (20+ words) with a blunt, punchy sentence (3-6 words). This "Burstiness" spike is how you kill the Scribbr score.
                2. DOWNGRADE ADJECTIVES: Strictly ban: "profound," "robust," "underscores," "pivotal," "fostering," and "comprehensive." Use grounded words: "real," "strong," "shows," "key," "building," and "full."
                3. STARTING VARIETY: Never start two sentences with the same part of speech. Start with: "Looking at," "Usually," "By doing this," or "Despite."
                4. MID-SENTENCE JUMPS: Use an em-dash (—) or semicolon (;) once per paragraph to connect two related but distinct thoughts.
                5. ACTIVE VOICE: Show a human perspective. Instead of "A score was assigned," use "The evaluation landed on a 6."

                STRICT: Keep all citations (e.g., Roehrich et al., 2014) exactly as written. Output ONLY the rewritten text. Maintain original word count within 10%.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to pass Scribbr and Turnitin as 100% human. Disrupt the flow and use grounded, direct language: "${text}"` }]}],
            generationConfig: {
                // Temperature 1.2 is the "Red Zone" - it forces the AI to avoid all common bot-phrases
                temperature: 1.2, 
                topP: 0.9,
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
