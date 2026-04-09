import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // 1. SET CORS HEADERS (Must be at the very top)
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // 2. HANDLE PREFLIGHT
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 3. VALIDATE REQUEST METHOD
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'No text provided' });
        }

        // 4. GEMINI 3.1 FLASH-LITE CONFIGURATION
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Using the exact ID for the 3.1 Flash-Lite Preview
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.1-flash-lite-preview" 
        });

        const prompt = `Humanize the following text. Make it sound conversational, natural, and eliminate all robotic patterns or "AI-typical" phrasing while preserving the core meaning: "${text}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const humanizedText = response.text();
        
        return res.status(200).json({ humanizedText });

    } catch (error) {
        console.error("Gemini 3.1 Error:", error);
        return res.status(500).json({ 
            error: "AI processing failed.",
            details: error.message 
        });
    }
}
