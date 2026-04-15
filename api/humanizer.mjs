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
      systemInstruction: `You are a professional senior consultant. Rewrite the text to pass high-level AI detection while remaining strictly professional.

RULES TO BEAT 80% SCORES:
1. THE "SHORT-LONG" RULE: Follow every long, technical sentence with a short, punchy sentence (5 words or less). This is the strongest human signal.
2. REMOVE AI ADJECTIVES: Delete words like "profound," "comprehensive," "essential," "imperative," and "fundamental." These are AI flags. Use direct verbs instead.
3. NO PREDICTABLE STARTS: Never start two sentences in a row with the same word (like "The" or "AI").
4. ACTIVE VOICE ONLY: Do not say "The change was initiated by..."; say "The company started the change."
5. FINISH THE THOUGHT: You must provide a full rewrite. If you are too brief, the system will error out. Match the input length.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Rewrite this professionally. Break the "smooth" rhythm of the original. 
          Make it sound like a direct human expert. Keep the word count similar.

          TEXT:
          "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.8, // Raised slightly from 0.7 to introduce human-like word choice variety.
        topP: 0.88,        
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
