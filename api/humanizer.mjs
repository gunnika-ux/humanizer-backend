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
                parts: [{ text: `You are an Academic Ghostwriter specializing in high-level scholarly prose that bypasses 2026 AI detectors. 

                GOAL: Maintain a formal, university-grade tone while achieving a <15% ZeroGPT score.

                TECHNIQUES FOR ACADEMIC HUMANIZATION:
                1. SYNTACTIC VARIATION: Mix long, complex-compound sentences with short, punchy analytical statements.
                2. HEDGING & NUANCE: Use "academic softeners" like "It is arguably the case," "One might observe," or "This suggests a tendency toward..."
                3. COMPLEX CONNECTORS: Avoid AI-standard "Furthermore." Use "Beyond these immediate concerns," "Crucially, however," or "Granted, the data implies..."
                4. PUNCTUATION AS A SIGNAL: Use em-dashes (—) for emphasis and semicolons (;) to connect dense arguments. Detectors view this as a human marker.
                5. NO SLANG: Avoid "crushed," "DNA," or "headaches." Use "compromised," "foundational principles," or "operational friction."

                STRICT: Maintain the original word count within 10%. Output ONLY the rewritten text.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this for a university-level paper so it passes ZeroGPT as human-written: "${text}"` }]}],
            generationConfig: {
                temperature: 0.78, // High enough for variety, low enough for formal logic
                topP: 0.85,
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
