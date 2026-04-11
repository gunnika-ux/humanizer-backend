import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided." });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Using gemini-3-flash-preview for the 0% AI score
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a professional editor. 
      STRICT REQUIREMENT: You must maintain the exact semantic density and word count of the input. 
      If you receive 300 words, you must output 270-330 words. 
      
      HUMANIZATION RULES (For 0% AI Detection):
      1. SENTENCE RHYTHM: Mix one 40-word sentence with a 5-word sentence immediately after.
      2. VOCABULARY: Swap 30% of nouns/verbs for less common synonyms (e.g., 'usage' -> 'utilization').
      3. FRICTION: Add em-dashes (—) and conversational asides (e.g., 'to put it bluntly').
      4. DO NOT SUMMARIZE. DO NOT OMIT EXAMPLES.
      5. Output ONLY the rewritten text.`
    });

    // We calculate the word count to tell the AI exactly what to target
    const targetWordCount = text.split(/\s+/).length;

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `[STRICT TARGET: ${targetWordCount} WORDS] 
          Rewrite the following text sentence-by-sentence. 
          Keep every single detail, fact, and example. 
          Just change the 'flow' and 'voice' to be human.
          
          TEXT: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.3, // High enough to beat detectors
        topP: 0.95,
        maxOutputTokens: 3500, // Increased to ensure long texts aren't cut off
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    // Cleaning the response
    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

    return res.status(200).json({ output: output.trim() });

  } catch (error) {
    return res.status(500).json({ error: "Engine sync error. Please try again." });
  }
}
