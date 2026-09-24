import Groq from "groq-sdk";
import * as z from "zod/v4";

/**
 * Shared Groq call helper for structured JSON output.
 *
 * Groq's Structured Outputs (`response_format: {type: "json_schema", ...}`)
 * takes a plain JSON Schema, not a Zod object, so we convert with zod's
 * built-in `z.toJSONSchema()` — no extra dependency, and it already emits
 * `additionalProperties: false`, which `strict: true` requires.
 *
 * openai/gpt-oss-120b — confirmed live on Groq's free tier by querying
 * /openai/v1/models directly (llama-3.3-70b-versatile, used in earlier code,
 * has since been retired from Groq's hosted lineup). It's a reasoning model:
 * responses include a "reasoning" field alongside "content" — only content
 * matters here, so callGroqJson reads just that. Swap the model string alone
 * to try others; re-check /v1/models first, since Groq's free lineup rotates.
 */
const MODEL = "openai/gpt-oss-120b";

export class LlmParseError extends Error {}

export const callGroqJson = async <T extends z.ZodType>(opts: {
  system: string;
  user: string;
  schema: T;
  schemaName: string;
  maxTokens?: number;
}): Promise<z.infer<T>> => {
  const client = new Groq(); // reads GROQ_API_KEY from the environment

  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 2000,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: opts.schemaName,
        strict: true,
        schema: z.toJSONSchema(opts.schema) as Record<string, unknown>,
      },
    },
  });

  const choice = completion.choices[0];

  // "length" means the response hit maxTokens mid-generation — surface this
  // distinctly rather than let it fall through as a confusing JSON parse
  // error, since the fix (raise maxTokens) is different from a bad response.
  if (choice.finish_reason === "length") {
    throw new LlmParseError("Response was cut off before completing — raise maxTokens.");
  }

  const raw = choice.message.content;
  if (!raw) throw new LlmParseError("Model returned no content");

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    throw new LlmParseError("Model output was not valid JSON");
  }

  const result = opts.schema.safeParse(parsedJson);
  if (!result.success) {
    throw new LlmParseError(`Model output did not match schema: ${result.error.message}`);
  }

  return result.data;
};
