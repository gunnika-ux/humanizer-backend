import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Input empty." });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: "You are a Structural Editor. Your goal is to break the sequence match for Scribbr/Turnitin while maintaining the 0% scores on ZeroGPT/Quillbot. You do this by shuffling the information order so the 'Logical Fingerprint' is destroyed."
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `SHUFFLE AND RECONSTRUCT (Keep the current vocabulary level):

          1. REVERSE LOGIC: Take the final point of the text and make it the opening hook. 
          2. FRAGMENTATION: Break long sentences into a 'Compound-Complex' followed by a 'Short-Punch' (4 words max).
          3. NO REPEATED OPENERS: Ensure no two sentences in a row start with the same part of speech.
          4. STRUCTURAL NOISE: Insert one em-dash (—) and one set of parentheses () per paragraph to create 'syntactic turbulence'.
          5. PROTECT VOCAB: Keep the current high-level 'weighty' words like 'quandary' and 'paradigm'—these are working for ZeroGPT. Just change the ORDER of the thoughts.

          TEXT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.85, // Lowered slightly to keep the good vocabulary stable
        topP: 0.9,
        maxOutputTokens: 3000,
      }
    });

    return res.status(200).json({ output: result.response.text().trim() });
  } catch (error) {
    return res.status(500).json({ error: "Engine logic error." });
  }
}
