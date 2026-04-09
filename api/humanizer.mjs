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
                parts: [{ text: `You are a Critical Revision Expert. Your ONLY goal is to pass Scribbr/Turnitin (<15%) by breaking the "Database Signature."

                SCRIBBR-KILLER RULES:
                1. NO BALANCE: AI writes balanced sentences. You must write "unbalanced" ones. Start a sentence with a single word followed by a comma. (e.g., "Initially, ..." or "Still, ...").
                2. THE "NON-SEQUITUR" FLOW: Connect two sentences with a semicolon (;) even if the connection is loose. This confuses Scribbr's logic-matching engine.
                3. USE "DIRTY" CONNECTORS: Ban all smooth transitions. Instead of "However," use "Then again,". Instead of "Consequently," use "So basically,".
                4. VARY THE STARTS: Every sentence must start with a different part of speech. Never start two sentences with "The" or "I".
                5. THE "DASH" TECHNIQUE: Use an em-dash (—) to insert a blunt, non-academic observation in the middle of a formal thought.

                STRICT: Do not change citations. Do not use AI fluff like "pivotal" or "comprehensive." Output ONLY the rewritten text.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Break the rhythm of this text to bypass Turnitin/Scribbr. Make it choppy and irregular but keep the citations: "${text}"` }]}],
            generationConfig: {
                // Temperature 1.3 is the "Chaos Zone." 
                // It makes the word choices weird enough to avoid database matches.
                temperature: 1.3, 
                topP: 0.85,
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
