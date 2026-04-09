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
                parts: [{ text: `Act as a Varied Human Writer. To bypass Scribbr/Turnitin, you must avoid any consistent "AI rhythm."

                UNIVERSAL DYNAMIC RULES:
                1. DYNAMIC SENTENCE FLOW: Randomly alternate between three styles: (a) Short and punchy, (b) Complex with a semicolon, (c) Observational with a mid-sentence dash (—).
                2. NO FORMAL CONNECTORS: Strictly ban "Furthermore," "Moreover," "Consequently," and "Therefore." Use natural transitions like "Also," "So," "This means," or "At the same time."
                3. VARY SENTENCE STARTS: Never start two consecutive sentences with the same word. Avoid "The" as a starter whenever possible.
                4. ACTIVE VOICE: Replace passive phrases (e.g., "It was found") with active human observations (e.g., "The results show" or "I noticed").
                5. VOCABULARY DIVERSITY: Use "Top-Tier" synonyms but keep them simple. (e.g., instead of "utilize," use "apply"; instead of "pivotal," use "essential").

                STRICT: Maintain all academic citations (e.g., Smith, 2023) exactly. Output ONLY the rewritten text without any intro or filler.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite the following text to be indistinguishable from a human-written draft. Ensure the logic flows naturally but the structure is irregular: "${text}"` }]}],
            generationConfig: {
                // High temperature + varied TopP/TopK creates unique outputs for every user
                temperature: 1.0, 
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
