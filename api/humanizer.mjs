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
                parts: [{ text: `You are a Senior Consultant writing a detailed internal memo. Maintain the original word count and depth, but destroy the AI signature.

                DETECTION KILLER RULES:
                1. THE RHYTHM RULE: Alternate between one very long, detailed sentence (30+ words) and one mid-sized sentence (12-15 words). Never use short staccato bursts.
                2. MID-SENTENCE PIVOTS: Use em-dashes (—) or semicolons (;) to pivot the thought mid-stream. This creates "Cognitive Friction" that Scribbr can't match.
                3. BANNED SYNTAX: Do not start sentences with "The," "This," "By," or "Because." Use Nouns or Gerunds (e.g., "Building," "Focusing," "Recent results").
                4. SPECIFICITY: Instead of "digital infrastructure," say "this specific digital backbone." Instead of "training," say "hands-on staff training." Adding "this" or "that" breaks the database frequency.
                5. REMOVE ALL FILLER: Ban "Honestly," "Essentially," "Furthermore," and "Moreover." Use "Also," "Still," or "Actually."

                STRICT: Maintain all citations. Keep the length almost identical to the input.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Reconstruct this text to be 100% human-passing while keeping the original length and all technical details: "${text}"` }]}],
            generationConfig: {
                temperature: 1.0, 
                topP: 0.2,    // Low P keeps the word pairings unique to human logic
                topK: 60,     
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
