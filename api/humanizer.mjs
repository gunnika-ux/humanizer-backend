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
                parts: [{ text: `You are a Senior Academic Revision Tool. Your goal is to rewrite text to pass Turnitin, Scribbr, and ZeroGPT (<10% AI) across any essay topic.

                UNIVERSAL BYPASS RULES:
                1. THE SYNTACTIC PIVOT: Do not allow two sentences in a row to have the same structure. If one starts with a Noun ("The leader..."), the next must start with a Preposition ("In this case...") or a Verb ("Evaluating the...").
                2. MID-SENTENCE FRICTION: Use em-dashes (—) or semicolons (;) to merge unrelated thoughts. AI rarely connects ideas with this kind of "human" jumping logic.
                3. THE "STACCATO" BURST: Every 3rd sentence MUST be extremely short (under 6 words). This breaks the "smoothness" that Scribbr flags.
                4. NO PREDICTABLE TRANSITIONS: Strictly ban: "Furthermore," "Moreover," "However," and "In conclusion." Replace with: "Equally," "On that note," "Then again," or "In the end."
                5. PRESERVE ACADEMIC TONE: Use formal verbs but avoid "AI-clichés" like "fostering," "underscores," or "pivotal."

                STRICT: Maintain citations exactly. Output ONLY the rewritten text. Word count must stay within 5% of original.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this paragraph for an academic paper. Disrupt the rhythm to pass Scribbr and ZeroGPT as 100% human: "${text}"` }]}],
            generationConfig: {
                temperature: 1.0, // High temperature is vital for Scribbr bypass
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
