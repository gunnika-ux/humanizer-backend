import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text" });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a professional editor. Your goal is to rewrite text so it is indistinguishable from human prose.
      
      STRICT RULES:
      1. NO TRUNCATION: You must return the same word count as the input (+/- 10%).
      2. RESTRUCTURE: Do not just swap words. Change the sentence order. Move the end of a sentence to the beginning.
      3. CHAOS RHYTHM: Use 1-2 very short sentences (under 6 words) in every paragraph.
      4. IMPERFECT FLOW: Start sentences with 'And', 'But', 'So', or 'Yet'. Use phrases like 'Think about it,' or 'The point is,'.
      5. NO AI CLICHES: Ban words like 'Furthermore', 'Moreover', 'In conclusion', 'Essentially'.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `DECONSTRUCT AND RE-EXPLAIN THIS. Keep the same length and details, but use a raw, human, and slightly informal professional voice.
          
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.35, // High heat to break Scribbr's pattern recognition
        topP: 0.99,        // Maximum vocabulary diversity
        maxOutputTokens: 4000, 
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite|Rewrite):/gi, "");

    if (output.split(" ").length < (text.split(" ").length * 0.5)) {
        return res.status(200).json({ 
            output: output + "... [Engine timed out. Please try again.]" 
        });
    }

    return res.status(200).json({ output: output });

  } catch (error) {
    return res.status(500).json({ error: "Sync error. Try again." });
  }
}
