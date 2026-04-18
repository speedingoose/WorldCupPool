import { GROUPS, GROUP_KEYS } from "./groups";

const ALLOWED_LEAGUES = ["Consular", "CLO"] as const;
const MAX_NAME_LENGTH = 100;
const ALLOWED_PAYLOAD_KEYS = new Set(["name", "email", "groups", "thirdPlaceAdvances"]);

/**
 * Neutralize spreadsheet formula-injection: if a string starts with one of the
 * trigger characters recognized by Google Sheets (=, +, -, @), prefix it with
 * a tab character so it is stored as plain text.
 */
function sanitizeString(value: string): string {
  if (/^[=+\-@]/.test(value)) {
    return `\t${value}`;
  }
  return value;
}

export interface ValidatedPayload {
  name: string;
  email: string;
  groups: Record<string, string[]>;
  thirdPlaceAdvances: Record<string, boolean>;
}

type ValidationSuccess = { ok: true; payload: ValidatedPayload };
type ValidationFailure = { ok: false; clientError: string; serverLog: string };
export type ValidationResult = ValidationSuccess | ValidationFailure;

function fail(clientError: string, serverLog: string): ValidationFailure {
  return { ok: false, clientError, serverLog };
}

export function validateAndSanitize(raw: unknown): ValidationResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return fail("Invalid request", "Body is not a plain object");
  }

  const body = raw as Record<string, unknown>;

  // Reject unknown top-level fields
  for (const key of Object.keys(body)) {
    if (!ALLOWED_PAYLOAD_KEYS.has(key)) {
      return fail("Invalid request", `Unknown field: ${key}`);
    }
  }

  // --- name ---
  if (typeof body.name !== "string" || !body.name.trim()) {
    return fail("Name is required", "name missing or empty");
  }
  const trimmedName = body.name.trim();
  if (trimmedName.length > MAX_NAME_LENGTH) {
    return fail("Name is too long", `name length ${trimmedName.length} exceeds ${MAX_NAME_LENGTH}`);
  }

  // --- email (league selector) ---
  if (
    typeof body.email !== "string" ||
    !(ALLOWED_LEAGUES as readonly string[]).includes(body.email)
  ) {
    return fail("Invalid league selection", `email not in allowed list: ${body.email}`);
  }
  const email = body.email as (typeof ALLOWED_LEAGUES)[number];

  // --- groups ---
  if (
    typeof body.groups !== "object" ||
    body.groups === null ||
    Array.isArray(body.groups)
  ) {
    return fail("Invalid groups", "groups is not a plain object");
  }
  const rawGroups = body.groups as Record<string, unknown>;

  // Reject unknown group keys
  for (const key of Object.keys(rawGroups)) {
    if (!GROUP_KEYS.includes(key)) {
      return fail("Invalid groups", `Unknown group key: ${key}`);
    }
  }

  const groups: Record<string, string[]> = {};
  for (const key of GROUP_KEYS) {
    if (!Array.isArray(rawGroups[key])) {
      return fail(`Group ${key} is missing`, `Group ${key} not an array`);
    }
    const rawTeams = rawGroups[key] as unknown[];
    if (rawTeams.length !== 4) {
      return fail(
        `Group ${key} must have exactly 4 teams`,
        `Group ${key} has ${rawTeams.length} teams`
      );
    }
    const allowedTeams = GROUPS[key];
    const teamStrings: string[] = [];
    for (const team of rawTeams) {
      if (typeof team !== "string") {
        return fail("Invalid team value", `Non-string team in group ${key}`);
      }
      if (!allowedTeams.includes(team)) {
        return fail("Invalid team in group", `Unknown team "${team}" in group ${key}`);
      }
      teamStrings.push(team);
    }
    if (new Set(teamStrings).size !== 4) {
      return fail(`Group ${key} must have 4 unique teams`, `Group ${key} has duplicate teams`);
    }
    groups[key] = teamStrings;
  }

  // --- thirdPlaceAdvances ---
  if (
    typeof body.thirdPlaceAdvances !== "object" ||
    body.thirdPlaceAdvances === null ||
    Array.isArray(body.thirdPlaceAdvances)
  ) {
    return fail("Invalid selection", "thirdPlaceAdvances is not a plain object");
  }
  const rawTpa = body.thirdPlaceAdvances as Record<string, unknown>;

  // Reject unknown keys
  for (const key of Object.keys(rawTpa)) {
    if (!GROUP_KEYS.includes(key)) {
      return fail("Invalid selection", `Unknown key in thirdPlaceAdvances: ${key}`);
    }
  }

  const thirdPlaceAdvances: Record<string, boolean> = {};
  for (const key of GROUP_KEYS) {
    if (typeof rawTpa[key] !== "boolean") {
      return fail("Invalid selection", `thirdPlaceAdvances.${key} is not boolean`);
    }
    thirdPlaceAdvances[key] = rawTpa[key] as boolean;
  }

  const trueCount = GROUP_KEYS.filter((k) => thirdPlaceAdvances[k]).length;
  if (trueCount !== 8) {
    return fail(
      "Exactly 8 third-place teams must advance",
      `thirdPlaceAdvances has ${trueCount} true values`
    );
  }

  // --- Sanitize user-controlled strings (name only; email is a validated enum) ---
  return {
    ok: true,
    payload: {
      name: sanitizeString(trimmedName),
      email,
      groups,
      thirdPlaceAdvances,
    },
  };
}
