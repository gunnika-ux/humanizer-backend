import { GoogleGenerativeAI } from "@google/generative-ai";

// Vercel/Serverless configuration - This must be at the top level
export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // --- PRIMARY ATTEMPT: GEMINI 3 FLASH ---
    // NO LINES REMOVED - ALL RULES PRESERVED
    const model = genAI.getGenerativeModel(
      { 
        model: "gemini-3-flash-preview",
        systemInstruction: `You are a professional academic rewriter.
        
        CRITICAL RULE: The word count of the output must be the same as the input. Do not summarize or reduce lines.
        CRITICAL RULE: Do not stop until you have humanized the entire text. Every paragraph must be completed.
        CRITICAL RULE: If you are nearing the end, you MUST complete the final sentence and thought. No half-finished thoughts.
        CRITICAL RULE: You must continue generating until the final punctuation mark of the final sentence is reached.
        
        HUMANIZATION RULES:
        1. UNBALANCED RHYTHM: Start sentences with 'And', 'But', or 'So' occasionally to break AI patterns.
        2. SENTENCE JITTER: Follow a long, complex academic sentence with a direct, punchy observation.
        3. HUMAN FRICTION: Use transitions like 'In all honesty', 'The reality is', or 'Critically'.
        4. ACADEMIC TONE: Avoid overly casual slang like 'people talked' or 'fancy rigs'. Use 'fostered dialogue' or 'advanced systems'.
        5. NO AI TRANSITIONS: Never use 'Furthermore', 'Moreover', or 'In conclusion'.
        6. CITATIONS: Keep all citations (e.g., Roehrich et al., 2014) in their exact positions.`
      },
      { apiVersion: "v1beta" }
    );

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `TASK: Rewrite the following university-level text to sound human. 
          Mirror the length exactly. Do not skip any sections. Do not stop until finished.
          
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 0.9, 
        topP: 0.95,
        maxOutputTokens: 8192, 
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    // Cleaning the response
    output = output.replace(/^(Option \d+|Output|Result|Humanized|Here's the rewrite):/gi, "");

    return res.status(200).json({ output: output });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message 
    });
  }
}
