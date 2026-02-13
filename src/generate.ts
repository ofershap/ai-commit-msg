export interface GenerateOptions {
  provider: "openai" | "anthropic";
  apiKey: string;
  model?: string;
  diff: string;
  language: string;
  customPrompt?: string;
}

const SYSTEM_PROMPT = `You are an expert at writing concise, meaningful commit messages following the Conventional Commits specification.

Rules:
- Use the format: type(scope): description
- Types: feat, fix, refactor, docs, style, test, chore, perf, ci, build
- Keep the first line under 72 characters
- Add a blank line then a body with bullet points explaining key changes
- Focus on WHY, not WHAT (the diff shows what)
- Be specific, not generic`;

export async function generateMessage(
  options: GenerateOptions,
): Promise<string> {
  const { provider, apiKey, model, diff, language, customPrompt } = options;

  const userPrompt = buildUserPrompt(diff, language, customPrompt);

  if (provider === "anthropic") {
    return callAnthropic(
      apiKey,
      model ?? "claude-sonnet-4-20250514",
      userPrompt,
    );
  }
  return callOpenAI(apiKey, model ?? "gpt-4o-mini", userPrompt);
}

function buildUserPrompt(
  diff: string,
  language: string,
  customPrompt?: string,
): string {
  let prompt = `Generate a commit message for the following diff. Write in ${language}.\n\n\`\`\`diff\n${diff}\n\`\`\``;
  if (customPrompt) {
    prompt += `\n\nAdditional instructions: ${customPrompt}`;
  }
  return prompt;
}

async function callOpenAI(
  apiKey: string,
  model: string,
  userPrompt: string,
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };
  const content = data.choices[0]?.message.content;
  if (!content) throw new Error("OpenAI returned empty response");
  return content.trim();
}

async function callAnthropic(
  apiKey: string,
  model: string,
  userPrompt: string,
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    content: { type: string; text: string }[];
  };
  const text = data.content.find((c) => c.type === "text")?.text;
  if (!text) throw new Error("Anthropic returned empty response");
  return text.trim();
}
