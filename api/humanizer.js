import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export default async function handler(req, res) {
    // 1. Enhanced CORS for Chrome Extensions
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST requests allowed' });
    }

    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Please provide text to process.' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Backend Error: GEMINI_API_KEY is not configured in Vercel.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        
        // 2. Initializing the model with relaxed safety settings to prevent "Processing Failed"
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.1-flash-lite-preview",
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
        });

        const prompt = `Rewrite the following text to sound 100% human-written. 
        Use a natural flow, varied sentence lengths, and a conversational tone. 
        Remove any robotic or overly formal 'AI-style' patterns while keeping the original meaning:
        
        "${text}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const output = response.text();

        if (!output) {
            throw new Error("AI returned an empty response.");
        }
        
        return res.status(200).json({ output: output });

    } catch (error) {
        console.error("Gemini System Error:", error.message);
        
        // Detailed error reporting to help you debug
        return res.status(500).json({ 
            error: error.message.includes('API key') 
                ? 'Invalid API Key. Please check your Google AI Studio settings.' 
                : `AI Processing Error: ${error.message}` 
        });
    }
}
