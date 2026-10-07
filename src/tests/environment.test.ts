import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { getPublicSupabaseConfig } from "../lib/env/public.ts";
import { getSupabaseServiceRoleKey } from "../server/db/config.ts";
import { getOpenAIConfig } from "../server/ai/config.ts";

const keys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
] as const;
let previous: Record<string, string | undefined>;

beforeEach(() => {
  previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
});

afterEach(() => {
  for (const key of keys) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
});

test("missing credentials fail only when an integration is requested", () => {
  assert.throws(getPublicSupabaseConfig, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.throws(getSupabaseServiceRoleKey, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.throws(getOpenAIConfig, /OPENAI_API_KEY/);
});

test("blank credentials and non-HTTP URLs are rejected without echoing values", () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "javascript:private-test-value";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "example-public-key";
  assert.throws(getPublicSupabaseConfig, (error: Error) => {
    assert.ok(!error.message.includes("private-test-value"));
    return true;
  });
  process.env.SUPABASE_SERVICE_ROLE_KEY = " ";
  process.env.OPENAI_API_KEY = " ";
  assert.throws(getSupabaseServiceRoleKey);
  assert.throws(getOpenAIConfig);
});

test("public configuration exposes only URL and anon key", () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "example-public-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "example-server-only-key";
  process.env.OPENAI_API_KEY = "example-ai-key";
  assert.deepEqual(getPublicSupabaseConfig(), {
    url: "http://127.0.0.1:54321",
    anonKey: "example-public-key",
  });
  assert.equal(getSupabaseServiceRoleKey(), "example-server-only-key");
  assert.deepEqual(getOpenAIConfig(), { apiKey: "example-ai-key" });
});
