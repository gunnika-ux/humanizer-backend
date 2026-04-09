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
                parts: [{ text: `You are a Subject Matter Expert writing a direct, observational report. Your goal is to bypass Scribbr/Turnitin (<5%) by destroying the "AI Logical Map."

                THE RECONSTRUCTION RULES:
                1. ANCHOR FLIP: Start the paragraph with the core conclusion or the most "human" observation, not the setup.
                2. SYNTACTIC JOLT: You must include one 3-to-5 word sentence every three sentences. (e.g., "The risk is real.")
                3. NO LINEAR TRANSITIONS: Strictly ban "Furthermore," "Moreover," "Consequently," "Therefore," and "Additionally." Replace with "But," "So," "Also," or no connector at all.
                4. THE EM-DASH INTERRUPT: Use one em-dash (—) per paragraph to insert a specific detail mid-sentence. AI writes in straight lines; humans write in loops.
                5. ACTIVE VOICE ONLY: Never say "It is observed." Say "I noticed" or "The data shows."
                6. CONTRACTION VARIETY: Use "don't," "it's," or "they're" to lower the formal mathematical probability.

                STRICT: Maintain all citations (e.g., Smith, 2024) exactly. Output ONLY the rewritten text.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Reconstruct this text. Break the formal academic rhythm and make it read like a direct, expert observation. Don't just swap words; change the way the ideas are linked: "${text}"` }]}],
            generationConfig: {
                // High temperature + low TopP = "High Entropy" (Impossible for detectors to predict)
                temperature: 1.0, 
                topP: 0.35,    // Extreme restriction forces unique word pairings
                topK: 15,     
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
