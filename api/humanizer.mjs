import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. CORS Setup for Chrome Extension
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided." });

    // 2. Initialize Gemini 3 (2026 Stable)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    /** * NOTE: We use gemini-3-flash-preview. 
     * It is faster and handles 'human friction' better than 2.5.
     */
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a professional human ghostwriter. 
      Your mission is to rewrite text to bypass the most aggressive AI detectors (Scribbr, Winston, Originality). 
      
      RULES:
      1. CRITICAL: NEVER use AI-style markers: 'In today's...', 'Furthermore', 'Moreover', 'In conclusion', or 'Additionally'.
      2. BURSTINESS: Use erratic sentence rhythms. Mix one very long, complex sentence (30+ words) with a tiny, punchy one (3-5 words).
      3. FRICTION: Use conversational asides—like 'if we're being honest' or 'frankly speaking'.
      4. NO FORMATTING: Do not use bullet points, bolding, or 'Options'. 
      5. COMPLETION: Finish the entire thought. Do not cut off mid-sentence.
      6. CITATIONS: Keep all citations (e.g., Smith, 2024) exactly as they are.
      
      Output ONLY the rewritten text. No intros. No outros.`
    });

    // 3. Safety Settings (Ensures 'Humanization' isn't blocked as 'Deception')
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    // 4. Content Generation
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `DECONSTRUCT AND RE-ENGINEER: 
          Match the tone of a skeptical expert. Change the sentence flow to be 'messy' but professional. 
          Use semicolons and em-dashes sporadically.
          
          INPUT TEXT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.32, // High variance to break detector uniformity
        topP: 0.95,
        maxOutputTokens: 2500, // High limit to prevent cut-off
      },
      safetySettings
    });

    const response = await result.response;
    let output = response.text().trim();

    // 5. Final Clean-up (Removes any accidental "Option 1" or "Here is your text" headers)
    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");
    output = output.replace(/^["']|["']$/g, ""); // Remove accidental surrounding quotes

    return res.status(200).json({ output: output.trim() });

  } catch (error) {
    console.error("DETAILED BACKEND ERROR:", error.message);
    
    // Provide a helpful error if it's a known issue
    let userMsg = "The engine is recalibrating. Try again in 10 seconds.";
    if (error.message.includes("429")) userMsg = "Quota exceeded. Wait 60 seconds.";
    if (error.message.includes("SAFETY")) userMsg = "Text flagged by safety filter. Try changing a few words.";

    return res.status(500).json({ error: userMsg });
  }
}
