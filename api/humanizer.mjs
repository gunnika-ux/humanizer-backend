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
      systemInstruction: `You are an expert academic writer with a distinct, non-robotic voice. 
      CRITICAL: You are NOT allowed to truncate or stop mid-sentence. Process every word.
      CRITICAL: The word count must mirror the input. 

      ACADEMIC HUMANIZATION (Bypass Strategy):
      1. RHYTHMIC BURSTS: Avoid standard Subject-Verb-Object loops. Start with prepositional phrases or dependent clauses (e.g., "Despite the evidence, one must...").
      2. SENTENCE JITTER: Break the "monotone" by following a 30-word complex sentence with a sharp 5-7 word analytical pivot.
      3. SCHOLARLY FRICTION: Use transitions that feel human but formal: 'Strikingly,' 'Paradoxically,' 'At its core,' or 'In this specific light.'
      4. ZERO AI CLICHÉS: Never use 'Furthermore', 'Moreover', 'In conclusion', or 'Additionally'. They are 100% AI markers.
      5. PRECISION OVER PERFECTION: Use heavy-hitting verbs (e.g., 'obfuscate', 'galvanize', 'scrutinize') but keep the flow slightly "unbalanced" as a human would write it.`
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `TASK: Humanize this academic text. Mirror the word count exactly. 
          Use a high-level scholarly tone but break the robotic AI predictability.
          
          INPUT TO HUMANIZE: "${text}"`
        }]
      }],
      generationConfig: {
        temperature: 1.1, // Bumped slightly from 0.9 to break the 100% AI pattern
        topP: 0.98,       
        maxOutputTokens: 4000, 
      }
    });

    const response = await result.response;
    let output = response.text().trim();

    output = output.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

    if (output.split(" ").length < (text.split(" ").length * 0.5)) {
        return res.status(200).json({ 
            output: output + "... [Engine timed out. Try again.]" 
        });
    }

    return res.status(200).json({ output: output });

  } catch (error) {
    return res.status(500).json({ error: "Sync error. Try again." });
  }
}
