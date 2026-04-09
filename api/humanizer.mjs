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
    
    // MODEL: Standard Flash (with v1beta for Thinking)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", 
      systemInstruction: "You are a senior analyst writing a direct internal memo. Your style is blunt and conversational but professional. Avoid flowery AI language (e.g., 'pivotal shift', 'foster'). Use dashes (—) and colons (:) to create a natural, irregular human flow."
    }, { apiVersion: 'v1beta' });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `STRIP AI SIGNATURES (Target 0% Scribbr/Turnitin):

          - TECHNIQUE: Use the 'Heartbeat' rhythm. One very long, detailed sentence followed immediately by a short, 3-word conclusion.
          - VARY LOGIC: Move the main conclusion of the text to the very first sentence.
          - NOISE: Insert one dash — or a pair of brackets [ ] to clarify a point.
          - FORBIDDEN: Do not use 'Furthermore', 'Moreover', 'Consequently', or 'In conclusion'.
          - VOCAB: Use precise but simple verbs (e.g., 'fix' instead of 'mitigate', 'use' instead of 'utilize').

          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.1, // High enough for randomness, low enough for professional logic
        topP: 0.9,
        thinkingConfig: {
          includeThoughts: false, 
          thinkingLevel: "HIGH" 
        },
        maxOutputTokens: 2000,
      }
    });

    const response = await result.response;
    const output = response.text();
    
    return res.status(200).json({ output: output.trim() });
    
  } catch (error) {
    console.error("Gemini Error:", error.message);
    return res.status(500).json({ 
      error: "Bypass Logic Failed: " + error.message 
    });
  }
}
