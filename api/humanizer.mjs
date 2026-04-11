import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Setup Headers for Chrome Extension (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle pre-flight request
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Input text is required." });
    }

    // 2. Initialize Google AI
    // Ensure GEMINI_API_KEY is set in Vercel Environment Variables
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Using gemini-1.5-flash for maximum speed and stability on free tier
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "You are a senior clinical auditor. Rewrite text to be gritty, analytical, and human. Avoid AI clichés like 'Furthermore'. Preserve all citations exactly."
    });

    // 3. Generate Content
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `STRICT HUMANIZATION PROTOCOL:
          - Match input length.
          - Use em-dashes for complexity.
          - Zero 'Summary' or 'Conclusion' sections.
          - Preserve citations (e.g. Smith, 2023).
          
          INPUT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.1, // High enough for human variance, low enough for stability
        topP: 0.95,
        maxOutputTokens: 2500, 
      }
    });

    // 4. Send Response
    const response = await result.response;
    const outputText = response.text();

    if (!outputText) {
      throw new Error("Empty response from AI engine.");
    }

    return res.status(200).json({ output: outputText.trim() });
    
  } catch (error) {
    // This logs the SPECIFIC error to your Vercel Dashboard
    console.error("FATAL BACKEND ERROR:", error.message);

    // Filter common errors for the user
    let userErrorMessage = "The engine is recalibrating. Please try again in 30 seconds.";
    
    if (error.message.includes("API_KEY_INVALID")) {
      userErrorMessage = "System Configuration Error (Invalid Key).";
    } else if (error.message.includes("429") || error.message.includes("quota")) {
      userErrorMessage = "High traffic. Please wait a moment.";
    }

    return res.status(500).json({ error: userErrorMessage });
  }
}
