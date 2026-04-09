import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: "Missing text" });

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using 1.5 Flash for better reliability on complex instructions
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `You are an Academic Consultant. Rewrite and EXPAND the following text to be 100% human-passing (<10% AI score). 

            RULES:
            1. INCREASE LENGTH: Add more technical detail and explanatory depth. Do not summarize.
            2. NO ROBOT OPENERS: Never start a sentence with "The", "This", "Moreover", or "By".
            3. JAGGED RHYTHM: Use a mix of very long (40+ word) sentences and short (5-word) punches.
            4. UNIQUE WORDS: Use "weighty," "stubborn," or "foundational" instead of "pivotal" or "essential."

            TEXT TO EXPAND: "${text}"` }]}],
            generationConfig: {
                temperature: 0.9, 
                topP: 0.3,       // Higher P prevents the "500 Logic Crash"
                maxOutputTokens: 4096, // Explicitly allowing much longer responses
            }
        });

        const output = result.response.text().trim();
        return res.status(200).json({ output });

    } catch (error) {
        console.error("Backend Error:", error);
        return res.status(500).json({ error: "API Timeout or Logic Crash. Please try a shorter snippet." });
    }
}
