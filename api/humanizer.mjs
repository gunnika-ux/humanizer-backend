import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // CORS HEADERS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text" });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    let result;

    try {
      // PRIMARY ATTEMPT: GEMINI 3 FLASH (The one you like)
      const model = genAI.getGenerativeModel(
        { 
          model: "gemini-3-flash-preview",
          systemInstruction: `You are a high-fidelity text rewriter. 
          CRITICAL RULE: The word count of the output must be the same as the input. Do not summarize.
          CRITICAL RULE: Do not stop until you have humanized the entire text. Do not leave out the final paragraph.
          
          HUMANIZATION RULES:
          1. UNBALANCED RHYTHM: Start sentences with 'And', 'But', or 'So' occasionally.
          2. SENTENCE JITTER: Follow a long sentence with a very short, punchy one.
          3. HUMAN FRICTION: Use conversational asides like 'frankly' or 'the reality is'.
          4. NO AI TRANSITIONS: Never use 'Furthermore', 'Moreover', or 'In conclusion'.
          5. VOCABULARY: Use gritty, active verbs instead of clinical AI vocabulary.`
        },
        { apiVersion: "v1beta" }
      );

      result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `TASK: Rewrite the following text to sound human. Mirror the length exactly. 
            Do not stop until every word is processed.
            
            INPUT: "${text}"`
          }]
        }],
        generationConfig: {
          temperature: 1.25,
          topP: 0.98,
          maxOutputTokens: 4000,
        }
      });
    } catch (primaryError) {
      console.error("Gemini 3 failed, using Safety Net to prevent negative ratings...");
      
      // SAFETY NET: GEMINI 2.5 FLASH (Only runs if 3.0 crashes)
      const fallbackModel = genAI.getGenerativeModel(
        { 
          model: "gemini-2.5-flash",
          systemInstruction: "Rewrite this text to be human. Match length exactly. Do not stop until finished."
        }
      );
      result = await fallbackModel.generateContent(text);
    }

    const response = await result.response;
    let output = response.text().trim();

    // Remove any labels the AI might accidentally add
    output = output.replace(/^(Option \d+|Output|Result|Humanized|Here's the rewrite):/gi, "");

    return res.status(200).json({ output: output });

  } catch (error) {
    console.error("Critical Error:", error.message);
    return res.status(500).json({ 
      error: "System Update", 
      details: "We are currently optimizing the engine. Please try again in 30 seconds." 
    });
  }
}
