import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateMessage } from "../src/generate.js";

const MOCK_DIFF = `diff --git a/src/utils.ts b/src/utils.ts
index abc1234..def5678 100644
--- a/src/utils.ts
+++ b/src/utils.ts
@@ -1,5 +1,8 @@
-export function add(a: number, b: number) {
-  return a + b;
+export function add(a: number, b: number): number {
+  if (typeof a !== "number" || typeof b !== "number") {
+    throw new TypeError("Arguments must be numbers");
+  }
+  return a + b;
 }`;

describe("generateMessage", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("calls OpenAI API with correct parameters", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: { content: "fix(utils): add type validation to add()" },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await generateMessage({
      provider: "openai",
      apiKey: "test-key",
      diff: MOCK_DIFF,
      language: "english",
    });

    expect(result).toBe("fix(utils): add type validation to add()");
    expect(fetchSpy).toHaveBeenCalledOnce();

    const call = fetchSpy.mock.calls[0];
    const [url, options] = call as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    const body = JSON.parse(options.body as string);
    expect(body.model).toBe("gpt-4o-mini");
    expect(body.messages).toHaveLength(2);
    expect(body.messages[1].content).toContain(MOCK_DIFF);
  });

  it("calls Anthropic API with correct parameters", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          content: [
            { type: "text", text: "fix(utils): add type validation to add()" },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await generateMessage({
      provider: "anthropic",
      apiKey: "test-key",
      diff: MOCK_DIFF,
      language: "english",
    });

    expect(result).toBe("fix(utils): add type validation to add()");

    const call = fetchSpy.mock.calls[0];
    const [url, options] = call as [string, RequestInit];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    const headers = (options as RequestInit).headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe("test-key");
  });

  it("uses custom model when provided", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "test" } }],
        }),
        { status: 200 },
      ),
    );

    await generateMessage({
      provider: "openai",
      apiKey: "test-key",
      model: "gpt-4o",
      diff: MOCK_DIFF,
      language: "english",
    });

    const body = JSON.parse(
      (fetchSpy.mock.calls[0]?.[1] as RequestInit).body as string,
    );
    expect(body.model).toBe("gpt-4o");
  });

  it("includes custom prompt when provided", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "test" } }],
        }),
        { status: 200 },
      ),
    );

    await generateMessage({
      provider: "openai",
      apiKey: "test-key",
      diff: MOCK_DIFF,
      language: "english",
      customPrompt: "Use emoji prefixes",
    });

    const body = JSON.parse(
      (fetchSpy.mock.calls[0]?.[1] as RequestInit).body as string,
    );
    expect(body.messages[1].content).toContain("Use emoji prefixes");
  });

  it("includes language in prompt", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "test" } }],
        }),
        { status: 200 },
      ),
    );

    await generateMessage({
      provider: "openai",
      apiKey: "test-key",
      diff: MOCK_DIFF,
      language: "hebrew",
    });

    const body = JSON.parse(
      (fetchSpy.mock.calls[0]?.[1] as RequestInit).body as string,
    );
    expect(body.messages[1].content).toContain("hebrew");
  });

  it("throws on OpenAI API error", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 }),
    );

    await expect(
      generateMessage({
        provider: "openai",
        apiKey: "bad-key",
        diff: MOCK_DIFF,
        language: "english",
      }),
    ).rejects.toThrow("OpenAI API error (401)");
  });

  it("throws on Anthropic API error", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 }),
    );

    await expect(
      generateMessage({
        provider: "anthropic",
        apiKey: "bad-key",
        diff: MOCK_DIFF,
        language: "english",
      }),
    ).rejects.toThrow("Anthropic API error (401)");
  });

  it("throws on empty OpenAI response", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ choices: [] }), { status: 200 }),
    );

    await expect(
      generateMessage({
        provider: "openai",
        apiKey: "test-key",
        diff: MOCK_DIFF,
        language: "english",
      }),
    ).rejects.toThrow("OpenAI returned empty response");
  });

  it("throws on empty Anthropic response", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ content: [] }), { status: 200 }),
    );

    await expect(
      generateMessage({
        provider: "anthropic",
        apiKey: "test-key",
        diff: MOCK_DIFF,
        language: "english",
      }),
    ).rejects.toThrow("Anthropic returned empty response");
  });
});
