import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Headers for Cross-Origin Resource Sharing (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided." });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    /**
     * MODEL SELECTION
     * Using 'gemini-3-flash-preview' (The Standard Tier).
     * We MUST use apiVersion: 'v1beta' to access thinkingConfig.
     */
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", 
      systemInstruction: "You are a student writing an informal first draft. Use first-person perspective, occasional contractions (can't, don't), and blunt, non-academic vocabulary. Avoid all polished AI transitional phrases like 'Furthermore' or 'In conclusion'."
    }, { apiVersion: 'v1beta' });

    // 2. GENERATION WITH "DIRTY" PROMPTING TO BEAT SCRIBBR
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `HUMANIZE THIS (Target 0% Scribbr/Turnitin):
          
          - START: Begin with "I've been looking into..." or "I actually think..."
          - STYLE: Use one very long sentence (50+ words) followed by a short fragment.
          - NOISE: Use brackets [ ] for a small personal side-note.
          - VOCAB: Swap academic words (e.g., 'mitigate') for simpler ones ('fix' or 'stop').
          
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.2, 
        topP: 0.95,
        // 🧠 The 'Thinking' configuration that breaks AI probability patterns
        thinkingConfig: {
          includeThoughts: false, 
          thinkingLevel: "HIGH" 
        },
        maxOutputTokens: 2000,
      }
    });

    const response = await result.response;
    const output = response.text();
    
    // 3. Return the processed text
    return res.status(200).json({ output: output.trim() });
    
  } catch (error) {
    // If it still fails, it's likely a region-specific model ID issue
    console.error("Gemini API Error:", error.message);
    
    // Fallback error message
    return res.status(500).json({ 
      error: "Scribbr-Bypass Error. Check terminal logs for: " + error.message 
    });
  }
}
