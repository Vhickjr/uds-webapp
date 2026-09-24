import Groq from "groq-sdk";
import * as z from "zod/v4";
import { requireUser } from "@/lib/server/require-user";
import { callGroqJson, LlmParseError } from "@/lib/server/groq";

/**
 * POST /api/llm/generate
 *
 * Suggests studio projects buildable from the components the user selected.
 * Runs server-side so GROQ_API_KEY never reaches the browser. Uses Groq's
 * free-tier inference (llama-3.3-70b-versatile) rather than a paid model.
 *
 * Request : { components: [{id, name}], skill, exampleCount }
 * Response: Idea[]  — matches the shape ProjectIdeaGenerator already expects.
 */

export const runtime = "nodejs";
// Never cache: the same components should be able to yield fresh ideas.
export const dynamic = "force-dynamic";

const SKILLS = ["beginner", "intermediate", "advanced"] as const;

const RequestSchema = z.object({
  components: z.array(z.object({ id: z.string(), name: z.string() })).min(1).max(40),
  skill: z.enum(SKILLS),
  exampleCount: z.number().int().min(1).max(6).default(3),
});

/**
 * The model returns component *names*; we map them back to inventory ids
 * afterwards, because ids are opaque and the model should reason about parts.
 */
const IdeaSchema = z.object({
  title: z.string(),
  summary: z.string(),
  usesComponents: z.array(z.string()),
  skillLevel: z.enum(SKILLS),
});

const ResultSchema = z.object({ ideas: z.array(IdeaSchema) });

const SYSTEM = `You suggest electronics and engineering projects for the UNILAG Design Studio, \
a university makerspace in Lagos, Nigeria.

Rules:
- Every project must be buildable from the components the user lists. Do not \
require parts that were not offered.
- Match the requested skill level. Beginner means single-concept and wireable in \
an afternoon; advanced means multi-subsystem with real integration work.
- Favour projects with local relevance — agriculture, power reliability, health \
access, water, transport — over generic tutorial builds.
- In usesComponents, reproduce the component names exactly as given.
- Keep summary to two or three sentences: what it does and why it is worth building.
- Respond with JSON matching the given schema only — no prose outside it.`;

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

  const { components, skill, exampleCount } = parsed.data;

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
        `Available components:\n${components.map((c) => `- ${c.name}`).join("\n")}\n\n` +
        `Suggest ${exampleCount} distinct ${skill}-level projects.`,
      schema: ResultSchema,
      schemaName: "project_ideas",
      maxTokens: 4000,
    });

    // Map names back to inventory ids so the UI can resolve them.
    const byName = new Map(components.map((c) => [c.name.toLowerCase(), c.id]));
    const ideas = result.ideas.map((idea, i) => ({
      id: `${Date.now()}-${i}`,
      title: idea.title,
      summary: idea.summary,
      requiredComponents: idea.usesComponents
        .map((n) => byName.get(n.toLowerCase()))
        .filter((id): id is string => Boolean(id)),
      skillLevel: idea.skillLevel,
    }));

    return Response.json(ideas);
  } catch (err) {
    if (err instanceof LlmParseError) {
      console.error("llm/generate parse failure:", err.message);
      return Response.json({ error: "Model returned unusable output" }, { status: 502 });
    }
    // Distinguish retryable from permanent so the client can act sensibly.
    if (err instanceof Groq.RateLimitError) {
      return Response.json({ error: "Rate limited — try again shortly." }, { status: 429 });
    }
    if (err instanceof Groq.AuthenticationError) {
      return Response.json({ error: "Invalid GROQ_API_KEY" }, { status: 500 });
    }
    if (err instanceof Groq.APIConnectionError) {
      return Response.json({ error: "Could not reach the model API." }, { status: 503 });
    }
    console.error("llm/generate failed:", err);
    return Response.json({ error: "Idea generation failed" }, { status: 500 });
  }
}
