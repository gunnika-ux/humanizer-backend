import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      // 🔥 TARGETING PERPLEXITY: We force the AI to avoid "Corporate AI" words
      systemInstruction: `You are an expert ghostwriter. Rewrite the provided text to bypass high-level AI detectors.
      
      CRITICAL RULES:
      1. NO AI-WORDS: Do not use 'transformative', 'foster', 'leverage', 'comprehensive', 'integration', or 'significant'. 
      2. JAGGED RHYTHM: Alternate between very long, descriptive sentences and tiny, blunt sentences (3-5 words).
      3. STARTING WORDS: Never start sentences with "The", "This", or "AI". Use "Since...", "By...", "While...", or start with a verb.
      4. HUMAN LOGIC: Avoid a perfect flow. Humans repeat an idea or use dashes (—) to add a side-thought.
      6. MATCH LENGTH: Do not summarize. Match the input word count almost exactly.`
    });

    const generate = async () => {
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `Explain this like a person who is slightly in a hurry but knows their stuff. 
            Break the intro/body/conclusion mold. 
            Original Text: "${text}"`
          }]
        }],
        generationConfig: {
          temperature: 0.92, // 🚀 High enough to beat logic-matching, low enough to stay professional
          topP: 0.98,        // 🚀 Nearly open vocabulary to avoid "Generic Language"
          maxOutputTokens: 3000,
        }
      });

      return (await result.response).text().trim();
    };

    let output1 = await generate();
    let output2 = await generate();

    // 🔹 SELECTION LOGIC: Pick the one that is "messier" (more punctuation diversity)
    const getComplexity = (str) => (str.match(/[,;:\-—()]/g) || []).length;
    let finalOutput = getComplexity(output1) > getComplexity(output2) ? output1 : output2;

    finalOutput = finalOutput.replace(/^(Option \d+|Output|Result|Here's the rewrite):/gi, "");

    // 🔹 THE "MANUAL" HUMANIZER (REWRITING YOUR BREAKSTRUCTURE)
    function humanizeFlow(text) {
      return text
        // AI hates em-dashes. Let's add them where commas are.
        .replace(/, /g, (m) => (Math.random() > 0.8 ? " — " : m))
        // Randomly merge paragraphs to look less "formatted"
        .replace(/\n\n/g, (m) => (Math.random() > 0.4 ? " " : m));
    }

    finalOutput = humanizeFlow(finalOutput);

    return res.status(200).json({ output: finalOutput });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error. Try again." });
  }
}
