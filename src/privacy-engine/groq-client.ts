import Groq from "groq-sdk";

let client: Groq | undefined;

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Groq configuration error: GROQ_API_KEY is missing.");
  }

  return (client ??= new Groq({ apiKey }));
}

function getModel(): string {
  const model = process.env.GROQ_MODEL?.trim();
  if (!model) {
    throw new Error("Groq configuration error: GROQ_MODEL is missing.");
  }

  return model;
}

export async function callGroq(prompt: string, options: { json?: boolean; maxTokens?: number } = {}): Promise<string> {
  if (!prompt.trim()) {
    throw new Error("Groq request error: prompt must not be empty.");
  }

  try {
    const response = await getClient().chat.completions.create({
      model: getModel(),
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: options.maxTokens ?? 1024,
      ...(options.json ? { response_format: { type: "json_object" as const } } : {}),
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("Groq response error: model returned an empty response.");
    }

    return content;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Groq ")) {
      throw error;
    }

    throw new Error(
      `Groq request failed: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
}
