import { NextRequest, NextResponse } from "next/server";
import { validateAndSanitize } from "@/lib/validation";
import { checkRateLimit, pruneRateLimitStore } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // IP-based rate limiting.
  // On Vercel, x-forwarded-for is always injected by the platform, so this
  // reliably identifies the originating client.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip");

  if (!ip) {
    // Cannot identify the client – reject to prevent rate-limit bypass.
    return NextResponse.json({ error: "Unable to process request" }, { status: 400 });
  }

  // Periodically evict stale entries to keep the in-memory store bounded.
  pruneRateLimitStore();

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = validateAndSanitize(body);
  if (!result.ok) {
    console.warn("[submit] Validation failed:", result.serverLog);
    return NextResponse.json({ error: result.clientError }, { status: 400 });
  }

  const { name, email, groups, thirdPlaceAdvances } = result.payload;

  // Build forwarded payload – secret is added server-side only
  const payload = {
    name,
    email,
    groups,
    thirdPlaceAdvances,
    submittedAt: new Date().toISOString(),
    secret: process.env.SUBMISSION_SECRET ?? "",
  };

  const appsScriptUrl = process.env.APPS_SCRIPT_URL;
  if (!appsScriptUrl) {
    // No URL configured – return success in dev mode
    return NextResponse.json({ ok: true });
  }

  try {
    const upstream = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!upstream.ok) {
      console.error("[submit] Upstream responded with status:", upstream.status);
      return NextResponse.json({ error: "Failed to forward submission" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(
      "[submit] Failed to reach upstream:",
      err instanceof Error ? err.message : "unknown error"
    );
    return NextResponse.json({ error: "Failed to reach submission server" }, { status: 502 });
  }
}
