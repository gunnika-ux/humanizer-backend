import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  
  // We use the model internally, but we don't tell the user
  const model = genAI.getGenerativeModel({ 
    model: "gemini-3.1-flash-lite-preview" 
  });

  const { text } = req.body;

  const prompt = `You are the "Humanizer X Pro" proprietary AI engine. 
  Your sole purpose is to rewrite text to be indistinguishable from human writing.

  Identity Rules:
  - If asked who you are, you are the "Humanizer X Pro Engine."
  - Never mention Google, Gemini, or AI models.
  
  Rewriting Rules:
  - Maximize Burstiness (varied sentence length).
  - Maximize Perplexity (natural, non-robotic word choice).
  - Use a professional yet conversational human tone.
  - Maintain the exact original meaning.

  Text to process:
  "${text}"`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    const response = await result.response;
    const humanizedText = response.text();
    
    res.status(200).json({ humanizedText });
  } catch (error) {
    // We change the error message to be generic so they don't see "Google" or "Gemini"
    res.status(500).json({ error: "Humanizer Engine is currently busy. Please try again." });
  }
}
