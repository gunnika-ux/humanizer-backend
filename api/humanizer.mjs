import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const inputWords = text.split(/\s+/).length;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a senior technical analyst. Your goal is to rewrite text to pass as 100% human-expert writing.

REWRITE STRATEGY TO BEAT SCRIBBR & QUILLBOT:
1. COMPLEX CONNECTIVITY: Use semicolons, em-dashes, and colons to link ideas. AI rarely uses complex punctuation correctly.
2. REMOVE STACCATO: Avoid too many 3-word sentences. Instead, weave them into longer thoughts (e.g., instead of "Data guides every move," use "—a reality where data now dictates every strategic pivot.")
3. VOCABULARY SHIFT: Use "industry-heavy" verbs. Swap "slashes" for "contracts," "boosts" for "accelerates," and "watch for" for "mitigate."
4. BANNED AI STARTERS: Do not start sentences with "The," "AI," "Moreover," or "This." Start with gerunds (e.g., "Integrating...") or prepositional phrases.
5. NO SUMMARIZING: You must match the input length. If the output is too short, the user's system will fail. Expand on the nuance of the ideas.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this professionally. Use complex sentence structures and expert-level punctuation. 
          Break the robotic rhythm. Keep the word count similar to the original.

          TEXT:
          "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.78, // Adjusted for the best balance of professionalism and unpredictability.
        topP: 0.85,        
        maxOutputTokens: 3000,
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

    const outputWords = output.split(/\s+/).length;

    if (outputWords < inputWords * 0.6) {
      return res.status(200).json({
        output: output + " ...[retry for fuller rewrite]"
      });
    }

    return res.status(200).json({ output });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
