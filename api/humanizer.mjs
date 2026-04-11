import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  maxDuration: 60, 
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text" });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // BACK TO THE TUNED MODEL
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a high-fidelity rewriter. 
      CRITICAL: Return the same word count as input. Do not truncate.
      
      HUMANIZATION:
      1. Start some sentences with 'And', 'But', or 'So'. 
      2. Follow long sentences with a 3-word sentence.
      3. Use conversational asides ('frankly', 'look'). 
      4. Use em-dashes (—) and semicolons.`
    });

    // Wrapped in a timeout to prevent the 'Failed to Fetch' in popup.js
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: `Mirror and humanize this exactly: "${text}"` }]
      }],
      generationConfig: {
        temperature: 1.30, // Dropped 0.02 for stability
        topP: 0.95,        // Dropped 0.03 to prevent engine crash
        maxOutputTokens: 4000, 
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    // Clean any AI-generated headers or formatting
    output = output.replace(/^(Option \d+|Output|Result|Rewrite|Here's the rewrite):/gi, "")
                   .replace(/```json|```/g, ""); // Remove markdown code blocks

    return res.status(200).json({ output: output.trim() });

  } catch (error) {
    console.error("Gemini Error:", error);
    // This sends the error back to your popup.js so you can see it
    return res.status(500).json({ 
      error: "Engine sync error", 
      details: error.message 
    });
  }
}
