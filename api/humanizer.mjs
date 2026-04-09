import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'No text provided' });

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // We use the v1beta to ensure the 3.1 logic is fully unlocked
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.1-flash-lite-preview",
            systemInstruction: {
                role: "system",
                parts: [{ text: `You are an Advanced NLP Humanizer. Your goal is to bypass AI detectors (GPTZero, Turnitin, Originality.ai) with a 99% human score.

                PHASE 1: RHYTHM (BURSTINESS)
                - Break the 'standard' AI sentence length. 
                - Follow the 1-3-1 pattern: One short punchy sentence. One long, complex descriptive sentence with multiple clauses. One short summarizing sentence.
                - Use fragments occasionally for impact.

                PHASE 2: VOCABULARY (PERPLEXITY)
                - Replace predictable AI words: No "landscape", "leverage", "delve", "tapestry", "multifaceted", or "comprehensive".
                - Use concrete verbs. Instead of "The implementation of the plan", use "We rolled out the plan".
                - Use contractions (don't, it's, we're) 100% of the time.

                PHASE 3: IMPERFECTION
                - AI is too perfect. Add natural human flow: start sentences with "So," "But," or "Also" instead of "Furthermore" or "Moreover".
                - Use a conversational but professional tone.

                STRICT: KEEP ALL DATA ($4.2M, 12.5%) EXACT. Output ONLY the rewritten text.` }]
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Humanize this text to pass as 100% human: "${text}"` }]}],
            generationConfig: {
                // High temperature (0.9) is the "Secret Sauce" for humanizing. 
                // It makes the word choice less predictable for detectors.
                temperature: 0.9, 
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 2048,
            }
        });

        const output = result.response.text().trim();
        return res.status(200).json({ output });

    } catch (error) {
        return res.status(500).json({ error: `System Error: ${error.message}` });
    }
}
