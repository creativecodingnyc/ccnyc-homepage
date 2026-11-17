export const dynamic = "force-dynamic";

const limits = new Map<string, { count: number; resetAt: number }>();

function clipped(value: unknown, length: number) {
  return typeof value === "string" ? value.slice(0, length) : "";
}

function allowRequest(request: Request) {
  const key =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const now = Date.now();
  const current = limits.get(key);
  if (!current || current.resetAt <= now) {
    limits.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  current.count += 1;
  return current.count <= 20;
}

export async function POST(request: Request) {
  if (!allowRequest(request)) {
    return Response.json({ ok: false }, { status: 429 });
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 32_000) {
    return Response.json({ ok: false }, { status: 413 });
  }

  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  const event = {
    service: "ccnyc-homepage",
    type: "client-error",
    message: clipped(input.message, 1_000),
    name: clipped(input.name, 100),
    stack: clipped(input.stack, 8_000),
    url: clipped(input.url, 1_000),
    userAgent: clipped(input.userAgent, 500),
    context: input.context,
    occurredAt: clipped(input.occurredAt, 100),
    receivedAt: new Date().toISOString(),
    version:
      process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "local",
  };

  const webhookUrl = process.env.OBSERVABILITY_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: `[CCNYC] ${event.message}`, event }),
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) throw new Error(`Webhook responded ${response.status}`);
    } catch (error) {
      console.error(
        "[observability] Could not forward client error",
        error,
        event,
      );
      return Response.json({ ok: false }, { status: 502 });
    }
  } else {
    console.error("[client-error]", event);
  }

  return Response.json({ ok: true }, { status: 202 });
}
