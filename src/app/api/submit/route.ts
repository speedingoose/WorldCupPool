import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

const GROUP_KEYS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, groups, thirdPlaceAdvances } = body as Record<string, unknown>;

  // Validate name
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Validate groups
  if (!groups || typeof groups !== "object" || Array.isArray(groups)) {
    return NextResponse.json({ error: "Groups are required" }, { status: 400 });
  }
  const groupsObj = groups as Record<string, unknown>;
  for (const key of GROUP_KEYS) {
    if (!Array.isArray(groupsObj[key])) {
      return NextResponse.json({ error: `Group ${key} is missing` }, { status: 400 });
    }
    const teams = groupsObj[key] as unknown[];
    if (teams.length !== 4) {
      return NextResponse.json({ error: `Group ${key} must have exactly 4 teams` }, { status: 400 });
    }
    const unique = new Set(teams);
    if (unique.size !== 4) {
      return NextResponse.json({ error: `Group ${key} must have 4 unique teams` }, { status: 400 });
    }
  }

  // Validate thirdPlaceAdvances
  if (!thirdPlaceAdvances || typeof thirdPlaceAdvances !== "object" || Array.isArray(thirdPlaceAdvances)) {
    return NextResponse.json({ error: "thirdPlaceAdvances is required" }, { status: 400 });
  }
  const tpaObj = thirdPlaceAdvances as Record<string, unknown>;
  for (const key of GROUP_KEYS) {
    if (typeof tpaObj[key] !== "boolean") {
      return NextResponse.json({ error: `thirdPlaceAdvances.${key} is missing` }, { status: 400 });
    }
  }
  const trueCount = GROUP_KEYS.filter((k) => tpaObj[k] === true).length;
  if (trueCount !== 8) {
    return NextResponse.json({ error: "Exactly 8 third-place teams must advance" }, { status: 400 });
  }

  // Build forwarded payload
  const payload = {
    name: (name as string).trim(),
    email: typeof email === "string" && email.trim() ? email.trim() : undefined,
    groups: groupsObj,
    thirdPlaceAdvances: tpaObj,
    submittedAt: new Date().toISOString(),
    secret: process.env.SUBMISSION_SECRET ?? "",
  };

  const appsScriptUrl = process.env.APPS_SCRIPT_URL;
  if (!appsScriptUrl) {
    // If no URL configured, just return success (dev mode)
    return NextResponse.json({ ok: true });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const upstream = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      return NextResponse.json(
        { error: "Failed to forward submission", detail: text.slice(0, 200) },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      { error: isTimeout ? "Submission server timed out" : "Failed to reach submission server" },
      { status: 502 },
    );
  }
}
