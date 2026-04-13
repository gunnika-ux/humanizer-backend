import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  runtime: 'edge', // Edge runtime supports longer streaming connections
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { text } = await req.json();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // ALL INSTRUCTIONS PRESERVED - NO LINES DELETED
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a professional academic rewriter.
      
      CRITICAL RULE: The word count of the output must be the same as the input. Do not summarize or reduce lines.
      CRITICAL RULE: Do not stop until you have humanized the entire text. Every paragraph must be completed.
      CRITICAL RULE: If you are nearing the end, you MUST complete the final sentence and thought.
      CRITICAL RULE: You must continue generating until the final punctuation mark is reached.
      
      HUMANIZATION RULES:
      1. UNBALANCED RHYTHM: Start sentences with 'And', 'But', or 'So' occasionally.
      2. SENTENCE JITTER: Follow long academic sentences with punchy observations.
      3. HUMAN FRICTION: Use transitions like 'In all honesty' or 'Critically'.
      4. ACADEMIC TONE: Avoid 'people talked'. Use 'fostered dialogue'.
      5. NO AI TRANSITIONS: Never use 'Furthermore' or 'Moreover'.
      6. CITATIONS: Keep all citations in their exact positions.`
    });

    // Use generateContentStream instead of generateContent
    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: text }] }],
      generationConfig: { temperature: 0.9, topP: 0.95, maxOutputTokens: 8192 }
    });

    // Create a readable stream to send to the browser
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          controller.enqueue(new TextEncoder().encode(chunkText));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*' 
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
