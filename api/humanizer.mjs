import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text" });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a high-fidelity rewriter. 
      CRITICAL: You are NOT allowed to truncate or stop mid-sentence. You must process every single sentence.
      If the input is 250 words, the output must be 250-300 words. 

      HUMANIZATION & DETECTOR BYPASS (ZeroGPT/Scribbr Target):
      1. UNBALANCED RHYTHM: Start occasional sentences with 'And', 'But', or 'So'. 
      2. SENTENCE JITTER: Follow a long, winding sentence with a very short, sharp one (3-5 words).
      3. HUMAN FRICTION: Use conversational asides—like 'frankly,' 'to be honest,' or 'the reality is'. 
      4. NO AI TRANSITIONS: Replace 'Furthermore' or 'Moreover' with gritty, direct links.
      5. VOCABULARY: Use technical but "messy" human terms (e.g., instead of 'foster,' use 'kickstart').`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `TASK: Mirror this text exactly. Do not leave out the final paragraph. 
          Do not stop until you have humanized the entire text. 
          
          INPUT TO HUMANIZE: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.32, // Slightly raised to shatter ZeroGPT's predictability patterns
        topP: 0.98,        // Full vocabulary access to increase 'Perplexity'
        maxOutputTokens: 4000, 
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    // Remove any accidental AI conversational markers or headers
    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

    // Safety: If the output is less than 50% of the input, indicate a timeout.
    if (output.split(" ").length < (text.split(" ").length * 0.5)) {
        return res.status(200).json({ 
            output: output + "... [Engine timed out. Please try humanizing this specific part again.]" 
        });
    }

    return res.status(200).json({ output: output });

  } catch (error) {
    return res.status(500).json({ error: "Sync error. Try again." });
  }
}
