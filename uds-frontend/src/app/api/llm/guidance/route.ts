import Groq from "groq-sdk";
import * as z from "zod/v4";
import { requireUser } from "@/lib/server/require-user";
import { callGroqJson, LlmParseError } from "@/lib/server/groq";

/**
 * POST /api/llm/guidance
 *
 * Turns a saved idea into an ordered build plan. Runs on Groq's free tier —
 * see /api/llm/generate for the rationale.
 *
 * Request : { idea: { title, summary, skillLevel, ... } }
 * Response: string[] — one step per entry, as the UI expects.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  idea: z.object({
    title: z.string(),
    summary: z.string().default(""),
    skillLevel: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
    componentNames: z.array(z.string()).default([]),
  }),
});

const ResultSchema = z.object({
  steps: z.array(z.string()).min(4).max(10),
});

const SYSTEM = `You write build plans for student engineering projects at a \
university makerspace.

Each step must be a concrete action a student can start, in build order — \
wiring and bench-testing parts individually before integration, firmware before \
enclosure, and a test/validation step at the end. Keep each step to one \
sentence. No preamble, no numbering (the UI numbers them).
Respond with JSON matching the given schema only — no prose outside it.`;

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", detail: parsed.error.issues },
      { status: 400 }
    );
  }

  const { idea } = parsed.data;

  if (!process.env.GROQ_API_KEY) {
    return Response.json(
      { error: "GROQ_API_KEY is not set on the server" },
      { status: 500 }
    );
  }

  try {
    const result = await callGroqJson({
      system: SYSTEM,
      user:
        `Project: ${idea.title}\n` +
        `Summary: ${idea.summary}\n` +
        `Skill level: ${idea.skillLevel}\n` +
        (idea.componentNames.length
          ? `Components: ${idea.componentNames.join(", ")}\n`
          : "") +
        `\nWrite the build plan.`,
      schema: ResultSchema,
      schemaName: "build_plan",
      maxTokens: 2000,
    });

    return Response.json(result.steps);
  } catch (err) {
    if (err instanceof LlmParseError) {
      console.error("llm/guidance parse failure:", err.message);
      return Response.json({ error: "Model returned unusable output" }, { status: 502 });
    }
    if (err instanceof Groq.RateLimitError) {
      return Response.json({ error: "Rate limited — try again shortly." }, { status: 429 });
    }
    if (err instanceof Groq.AuthenticationError) {
      return Response.json({ error: "Invalid GROQ_API_KEY" }, { status: 500 });
    }
    if (err instanceof Groq.APIConnectionError) {
      return Response.json({ error: "Could not reach the model API." }, { status: 503 });
    }
    console.error("llm/guidance failed:", err);
    return Response.json({ error: "Guidance generation failed" }, { status: 500 });
  }
}
