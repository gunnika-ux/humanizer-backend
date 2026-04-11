import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided." });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a clinical auditor. Your writing style is dense, analytical, and highly irregular. 
      
      CORE PROTOCOLS:
      - BURSTINESS: Every paragraph must contain one very long, complex sentence and one short, sharp sentence.
      - LINGUISTIC FRICTION: Replace common AI words (ensure, foster, transition) with gritty alternatives (guarantee, spark, shift).
      - NO SUMMARY: You must rewrite the input sentence-by-sentence to maintain exact length.
      - NO INTROS: Start immediately with the text.
      
      To beat 2026 detectors: use em-dashes, semicolons, and occasional parenthetical asides.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `RE-ENGINEER THIS TEXT. Keep it roughly the same word count. Break the AI rhythm. 
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.3, // Raised back up to break the 100% AI score
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1500, // Reduced to save your laptop's memory
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ]
    });

    const response = await result.response;
    let output = response.text().trim();
    
    // Safety check to prevent huge overflows
    output = output.split(" ").slice(0, text.split(" ").length + 50).join(" ");

    return res.status(200).json({ output: output.trim() });

  } catch (error) {
    return res.status(500).json({ error: "Sync error. Try again." });
  }
}
