import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // 1. FORCE HEADERS ON EVERY REQUEST
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // 2. IMMEDIATELY HANDLE PREFLIGHT (The 'OPTIONS' request)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 3. ONLY ALLOW POST FOR THE ACTUAL LOGIC
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'No text provided' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Rewrite this text to sound like a natural human wrote it: ${text}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        return res.status(200).json({ humanizedText: response.text() });

    } catch (error) {
        console.error("AI Error:", error);
        return res.status(500).json({ error: "AI processing failed." });
    }
}
