export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { content } = req.body;
  const key = process.env.GOOGLE_API_KEY;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "Rewrite the following text to sound like a natural human, vary sentence structures, and bypass AI detection. Do not change the meaning: " + content }]
        }]
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      const result = data.candidates[0].content.parts[0].text;
      res.status(200).json({ humanizedResult: result });
    } else {
      res.status(500).json({ error: "AI failed to process text" });
    }
  } catch (error) {
    res.status(500).json({ error: "Connection error" });
  }
}