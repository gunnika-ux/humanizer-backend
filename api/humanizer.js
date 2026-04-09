import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'No text provided' });

        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);

        // The "System Instruction" is the secret to stopping the "Option 1, Option 2" behavior
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.1-flash-lite-preview",
            systemInstruction: "You are a professional rewrite engine. Your task is to humanize text. Output ONLY the rewritten text. Never provide options, never explain your changes, and never include introductory or concluding remarks. If the user provides text, return only the single, best humanized version of that text.",
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
        });

        // We make the prompt very aggressive about being direct
        const prompt = `Rewrite this text to be 100% natural and human: "${text}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        // Use .trim() to ensure no accidental whitespace or new lines are sent back
        const output = response.text().trim();

        if (!output) throw new Error("Empty response");

        return res.status(200).json({ output: output });

    } catch (error) {
        return res.status(500).json({ error: `System Error: ${error.message}` });
    }
}
