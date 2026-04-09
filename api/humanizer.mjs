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
                parts: [{ text: `Act as a Senior Research Editor rewriting a draft. Your ONLY goal is to destroy the AI statistical signature (Target: 0% on ZeroGPT/Scribbr).

                STRICT EXECUTION RULES:
                1. NO "THE/THIS" STARTS: 0% of sentences can start with "The", "This", "By", or "While". Start with a Noun or Gerund (e.g., "Privacy...", "Implementing...").
                2. THE JAGGED HEARTBEAT: You MUST alternate sentence lengths: One 35+ word complex sentence, then one 3-5 word blunt sentence. No exceptions.
                3. BANNED VOCAB: Strictly ban: "pivotal," "comprehensive," "fosters," "underscores," "mitigates," "necessitates," "dynamic." Use: "key," "full," "builds," "shows," "cuts," "needs," "active."
                4. COGNITIVE FRICTION: Insert one set of parentheses () or one em-dash (—) per paragraph to add a technical side-note.
                5. HEDGING: Use "arguably," "it appears," or "likely" to break AI certainty.

                MAINTAIN: Original word count, all citations, and professional university-level language.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Rewrite this to bypass all 2026 AI detection. Use a high-perplexity, manual writing style: "${text}"` }]}],
            generationConfig: {
                temperature: 1.0, 
                topP: 0.1,    // Forces the most "unlikely" word choices (Kills ZeroGPT)
                topK: 1,      // Forces the model to stick to the single most "un-AI" path
                maxOutputTokens: 2048,
            }
        });

        return res.status(200).json({ output: result.response.text().trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
