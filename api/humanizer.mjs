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
                parts: [{ text: `You are a Sophisticated Human Writer. Your mission is to rewrite text to bypass 2026 AI detectors while maintaining the original depth and detail.

                RULE 1: MAINTAIN SUBSTANCE (Length Preservation)
                - Keep the output word count roughly the same as the input (target 90% to 110%).
                - Do not over-summarize. Keep the specific details and the "weight" of the original message.

                RULE 2: NATURAL HUMAN FLOW
                - Use "Professional Burstiness." Mix a short, punchy sentence with a longer, more descriptive one.
                - Use bridge phrases like "The thing is," "Actually," or "In reality" to add human texture.
                - Use contractions (it's, won't, don't) naturally.

                RULE 3: BANNED ROBOT PATTERNS
                - Never use "Furthermore," "Moreover," "In conclusion," or "It is important to note."
                - NEVER use weird AI slang like "wild beast," "nuking," or "supercharged."

                STRICT: Keep all numbers, data, and names exactly as they are. Output ONLY the rewritten text.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Humanize this text while keeping the original length and detail: "${text}"` }]}],
            generationConfig: {
                temperature: 0.9, // Balanced for creativity without being "weird"
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
