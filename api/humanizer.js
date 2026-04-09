import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Input required' });

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // This is the verified ID for the 3.1 Flash-Lite series as of April 2026
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

        const prompt = `Act as a professional editor. Rewrite the following text to be completely natural and human-like. 
        Break up complex sentences, use varied vocabulary, and remove all robotic structures. 
        Maintain the original meaning but make it indistinguishable from human writing: "${text}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        return res.status(200).json({ output: response.text() });

    } catch (error) {
        console.error("System Error:", error.message);
        return res.status(500).json({ error: "Processing failed. Please try again." });
    }
}
