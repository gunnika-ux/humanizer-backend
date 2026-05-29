import OpenAI from "openai";

const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

if (req.method === "OPTIONS") {
return res.status(200).end();
}

try {
const { text } = req.body;

```
if (!text || !text.trim()) {
  return res.status(400).json({
    error: "No text provided"
  });
}

const systemInstruction = `Rewrite the text like a natural human writer.
```

Requirements:

* Preserve all facts, names, dates, numbers, quotations, evidence, and meaning.
* Do not summarize.
* Keep approximately the same length.
* Correct grammar, spelling, punctuation, and awkward phrasing.
* Maintain the original tone and purpose.
* Rewrite naturally rather than closely mirroring the original wording.
* Use a mix of short, medium, and long sentences.
* Vary sentence structure and sentence openings.
* Prefer direct, specific wording over generic wording.
* Preserve technical accuracy in academic, scientific, professional, and business content.
* Keep the writing readable and natural.

Style:

* Write as if an educated person is explaining the ideas clearly.
* Allow natural variation in rhythm and phrasing.
* Avoid overly polished or formulaic language.
* Avoid robotic transitions.
* Avoid repetitive sentence patterns.
* Avoid unnecessary filler.
* Let the writing flow naturally without sounding mechanically optimized.

Do not:

* Add information.
* Remove important information.
* Change factual meaning.
* Add markdown formatting.
* Explain your changes.

Output only the rewritten text.`;

```
const models = [
  "gpt-5.4-mini",
  "gpt-5-mini"
];

const generateFromModel = async (modelName) => {
  const response = await openai.chat.completions.create({
    model: modelName,
    temperature: 0.9,
    top_p: 0.95,
    messages: [
      {
        role: "system",
        content: systemInstruction
      },
      {
        role: "user",
        content: `Rewrite the following text naturally while preserving meaning and intent.
```

TEXT:

${text}`
}
]
});

```
  const textOutput =
    response.choices?.[0]?.message?.content?.trim();

  if (!textOutput) {
    throw new Error("Empty response");
  }

  return textOutput;
};

const generateWithFallback = async () => {
  for (const model of models) {
    try {
      return await generateFromModel(model);
    } catch (err) {
      console.warn(`Model ${model} failed:`, err.message);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  throw new Error("All models failed");
};

let finalOutput = await generateWithFallback();

finalOutput = finalOutput.replace(
  /^(Option\s+\d+|Output|Result|Here's the rewrite)\s*:\s*/i,
  ""
);

function cleanText(text) {
  return text
    .replace(/\s{2,}/g, " ")
    .replace(/,\s*\./g, ".")
    .replace(/\.\./g, ".")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

finalOutput = cleanText(finalOutput);

return res.status(200).json({
  output: finalOutput
});
```

} catch (error) {
console.error("FULL ERROR:", error);

```
return res.status(500).json({
  error: error.message || "Unknown error"
});
```

}
}
