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
      systemInstruction: "You are a senior clinical auditor. You overhaul academic evaluations to sound like high-level human expert analysis. You strictly maintain all citations (e.g., Deber, 2018) and specific scores, but you destroy robotic sentence rhythms and 'polite' AI phrasing."
    }, { apiVersion: 'v1beta' });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `DECONSTRUCT AND REBUILD (Target 0% Everywhere):
          
          1. STRUCTURE (High Burstiness): 
             - Start with a massive, complex analytical sentence (50+ words) using a semi-colon (;).
             - Follow with a 3-word blunt realization.
             - Preserve the specific scores (6.0, 5, 6.25) and all citations within the text.
          2. THE FRICTION RULE: Replace AI-favored phrases with direct, 'gritter' professional terms.
             - Instead of 'demonstrated an ability,' use 'had a hardwired knack for.'
             - Instead of 'opportunity to reinforce,' use 'requirement to tighten.'
          3. NO SUMMARIES: Maintain the original length. Do not combine the two domains.
          4. PUNCTUATION: Use one set of brackets [] to add a technical side-note.
          
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.5, // 🚀 High randomness for high-level reasoning
        topP: 0.99,
        // 🧠 MAXIMUM BRAINPOWER:
        thinkingConfig: {
          thinkingLevel: "HIGH" 
        },
        maxOutputTokens: 2500,
      }
    });

    const response = await result.response;
    return res.status(200).json({ output: response.text().trim() });
    
  } catch (error) {
    console.error("Lite Reasoning Error:", error.message);
    return res.status(500).json({ error: "High-level processing failed. Try again." });
  }
}
