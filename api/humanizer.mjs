import { GoogleGenerativeAI } from "@google/generative-ai";

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
      model: "gemini-3.1-flash-lite-preview", 
      systemInstruction: "You are a senior executive writing a confidential internal memo. Your tone is blunt, dense, and avoids all 'educational' or 'explanatory' phrasing. You write with the assumption that the reader is already an expert."
    }, { apiVersion: 'v1beta' });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `RECONSTRUCT FOR ZERO DETECTION:
          
          1. SUBJECT-DRIVEN OPENERS: Never start a sentence with "This," "The," "It," or "There." Start every sentence with a concrete noun or a technical concept (e.g., "Coalition building demands..." or "Systemic friction occurs...").
          2. ASYMMETRICAL PHRASING: Mix one very long sentence (40+ words) with two very short, blunt sentences (4-6 words).
          3. VOCABULARY SHIFT: Use "gritter" professional verbs: 'anchored', 'gutted', 'leveraged', 'stagnated', 'hardwired'. 
          4. CITATION WEAVING: Place citations (e.g., Deber, 2018) inside parentheses mid-sentence, not at the end.
          5. NO SUMMARIES: Maintain the original volume. Finish the transformation section completely.
          
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.48, 
        topP: 1.0, 
        thinkingConfig: {
          thinkingLevel: "HIGH" 
        },
        maxOutputTokens: 3500, 
      }
    });

    const response = await result.response;
    return res.status(200).json({ output: response.text().trim() });
    
  } catch (error) {
    console.error("Lite Logic Error:", error.message);
    return res.status(500).json({ error: "System overload. Try again." });
  }
}
