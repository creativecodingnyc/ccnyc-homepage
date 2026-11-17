import {
  PRESENTATION_SIGNUP_URL,
  PUBLIC_MEETUP_SHEET_CSV_URL,
} from "@/lib/endpoints";

export const dynamic = "force-dynamic";

type CheckResult = { ok: boolean; latencyMs: number; error?: string };

async function check(
  name: string,
  url: string,
  validate: (response: Response) => Promise<boolean>,
) {
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    const valid = response.ok && (await validate(response));
    return [
      name,
      {
        ok: valid,
        latencyMs: Date.now() - startedAt,
        ...(valid ? {} : { error: `Unexpected response (${response.status})` }),
      },
    ] as const;
  } catch (error) {
    return [
      name,
      {
        ok: false,
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    ] as const;
  }
}

export async function GET() {
  const entries = await Promise.all([
    check(
      "signup",
      `${PRESENTATION_SIGNUP_URL}?action=list`,
      async (response) => {
        const data: { ok?: boolean } = await response.json();
        return data.ok === true;
      },
    ),
    check("calendar", PUBLIC_MEETUP_SHEET_CSV_URL, async (response) =>
      (await response.text()).includes("Meeting date"),
    ),
  ]);
  const checks = Object.fromEntries(entries) as Record<string, CheckResult>;
  const ok = Object.values(checks).every((result) => result.ok);

  return Response.json(
    {
      ok,
      checks,
      version:
        process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "local",
      checkedAt: new Date().toISOString(),
    },
    {
      status: ok ? 200 : 503,
      headers: { "cache-control": "no-store" },
    },
  );
}
