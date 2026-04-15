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
      systemInstruction: `You are an elite ghostwriter. Your goal is to rewrite professional text so it bypasses all AI detectors by introducing "Human Perplexity."

CRITICAL DETECTION BYPASS RULES:
1. NO PREDICTABLE PATTERNS: Do not start sentences with "The," "AI," "This," or "Organizations." Use varied openings (e.g., "Integrating...", "By...", "At the core...").
2. INTERRUPTED FLOW: Use dashes (—) or parentheticals to break up the "perfect" flow. AI writes straight lines; humans write with "side-thoughts."
3. BANNED AI VOCABULARY: If you use the words "transformative," "tapestry," "delve," "foster," "leverage," or "comprehensive," the rewrite is a failure. Use simpler, punchier verbs.
4. SYNTACTIC VARIATION: Mix extremely long, winding sentences (30+ words) with blunt, 3-word observations. 
5. NO SUMMARIZING: You must maintain the original word count. Expand on the "how" and "why" to ensure the output length matches the input length.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this professionally but use an "irregular" human rhythm. 
          Break every logical pattern. Keep the word count similar. 

          TEXT:
          "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.84, // Pushed to 0.84 to force "unlikely" (human) word choices.
        topP: 0.92,        
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
