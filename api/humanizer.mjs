import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // CORS Setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    let result;

    try {
      // --- PRIMARY ATTEMPT: GEMINI 3 FLASH (YOUR PREFERRED MODEL) ---
      const model = genAI.getGenerativeModel(
        { 
          model: "gemini-3-flash-preview",
          systemInstruction: `You are a professional academic rewriter.
          
          CRITICAL RULE: The word count of the output must be the same as the input. Do not summarize or reduce lines.
          CRITICAL RULE: Do not stop until you have humanized the entire text. Every paragraph must be completed.
          CRITICAL RULE: If you are nearing the end, you MUST complete the final sentence and thought. No half-finished thoughts.
          
          HUMANIZATION RULES:
          1. UNBALANCED RHYTHM: Start sentences with 'And', 'But', or 'So' occasionally to break AI patterns.
          2. SENTENCE JITTER: Follow a long, complex academic sentence with a direct, punchy observation.
          3. HUMAN FRICTION: Use transitions like 'In all honesty', 'The reality is', or 'Critically'.
          4. ACADEMIC TONE: Avoid overly casual slang like 'people talked'. Use 'fostered dialogue' or 'open communication'.
          5. NO AI TRANSITIONS: Never use 'Furthermore', 'Moreover', or 'In conclusion'.
          6. CITATIONS: Keep all citations (e.g., Roehrich et al., 2014) in their exact positions.`
        },
        { apiVersion: "v1beta" }
      );

      result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `TASK: Rewrite the following university-level text to sound human. 
            Mirror the length exactly. Do not skip any sections. Do not stop until finished.
            
            INPUT: "${text}"`
          }]
        }],
        generationConfig: {
          temperature: 1.0, // Optimized Zone: Better humanization than 0.9, stable completion.
          topP: 0.95,
          maxOutputTokens: 8192, // High limit to ensure long university texts do not cut off.
        }
      });
    } catch (primaryError) {
      console.error("Gemini 3 failed, using Safety Net to prevent negative ratings:", primaryError.message);
      
      // --- SAFETY NET: GEMINI 2.5 FLASH ---
      const fallbackModel = genAI.getGenerativeModel(
        { 
          model: "gemini-2.5-flash",
          systemInstruction: "Rewrite to be human. Match length exactly. Do not stop until finished."
        }
      );
      result = await fallbackModel.generateContent(text);
    }

    const response = await result.response;
    let output = response.text().trim();

    // Final cleanup of any accidental AI labels
    output = output.replace(/^(Option \d+|Output|Result|Humanized|Here's the rewrite):/gi, "");

    return res.status(200).json({ output: output });

  } catch (error) {
    console.error("Critical Error:", error.message);
    return res.status(500).json({ 
      error: "Optimization in Progress", 
      details: "Our engine is currently being tuned. Please try again in 30 seconds." 
    });
  }
}
