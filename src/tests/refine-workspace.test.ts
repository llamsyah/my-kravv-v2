import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Refinement } from "../domain/refinement/refinement.ts";
import {
  comparisonVersion,
  comparisonText,
  queueLabel,
} from "../features/refinements/presentation.ts";
import {
  getActiveRefinement,
  getRefinementQueue,
} from "../server/db/refinements.ts";
import {
  fixtureUrl,
  fixtureKey,
  fixtureUserId,
} from "./helpers/auth-fixture.ts";
import { fixtureCompanyId, fixtureThoughtId } from "./helpers/ai-fixture.ts";
const row = (
  status: Refinement["status"],
  final: string | null = null,
): Refinement => ({
  id: randomUUID(),
  user_id: fixtureUserId,
  company_id: fixtureCompanyId,
  thought_id: fixtureThoughtId,
  generation_request_id: randomUUID(),
  ai_run_id: null,
  ai_content: "Aku belum memeriksa laporannya.",
  user_final_content: final,
  status,
  prompt_version: "refine-v1",
  output_schema_version: "refine-schema-v1",
  provider: "groq",
  model: "openai/gpt-oss-20b",
  warnings: [],
  created_at: "2026-10-09T00:00:00Z",
  resolved_at: null,
});
test("Refine comparison preserves edited acceptance independently of historical and suggested targets", () => {
  const accepted = row(
    "ACCEPTED",
    "aku belum baca laporannya, jadi belum tahu.",
  );
  const suggestion = row("SUGGESTED");
  assert.equal(comparisonVersion(null, accepted, suggestion), accepted);
  assert.equal(comparisonText(accepted), accepted.user_final_content);
  assert.equal(
    comparisonText({ ...accepted, status: "SUPERSEDED" }),
    accepted.user_final_content,
  );
  assert.equal(comparisonVersion(suggestion, accepted, suggestion), suggestion);
  for (const status of ["REJECTED", "SUPERSEDED"] as const)
    assert.equal(
      comparisonVersion(row(status), accepted, suggestion),
      accepted,
    );
  assert.equal(comparisonVersion(null, null, null), null);
  assert.equal(
    comparisonText(row("ACCEPTED")),
    "Aku belum memeriksa laporannya.",
  );
});
test("queue never confuses unknown, rejected history, and unexamined absence", () => {
  assert.equal(queueLabel([], false), "Belum dirapikan");
  assert.equal(
    queueLabel(["REJECTED", "SUPERSEDED"], false),
    "Riwayat ditinjau",
  );
  assert.equal(queueLabel(null, false), "Status belum dapat dipastikan");
  assert.equal(queueLabel([], null), "Status belum dapat dipastikan");
  assert.equal(queueLabel(["ACCEPTED", "SUGGESTED"], true), "Sedang diproses");
  assert.equal(queueLabel(["ACCEPTED"], false), "Versi diterima");
});
test("queue failures and inconsistent returned owners stay unknown rather than unrefined", async () => {
  for (const failed of [true, false]) {
    const client = createClient(fixtureUrl, fixtureKey, {
      global: {
        fetch: async () =>
          failed
            ? Response.json(
                { message: "synthetic private failure" },
                { status: 503 },
              )
            : Response.json([
                {
                  thought_id: fixtureThoughtId,
                  company_id: fixtureCompanyId,
                  user_id: randomUUID(),
                  status: "ACCEPTED",
                },
              ]),
      },
    });
    const state = (
      await getRefinementQueue(client, fixtureUserId, fixtureCompanyId, [
        fixtureThoughtId,
      ])
    ).get(fixtureThoughtId)!;
    assert.equal(
      queueLabel(state.statuses, state.pending),
      "Status belum dapat dipastikan",
    );
  }
});
test("accepted lookup is owner scoped and independent of history cursor; corrupted duplicates fail closed", async () => {
  const accepted = row("ACCEPTED", "Pilihan milikku.");
  let duplicate = false;
  const client = createClient(fixtureUrl, fixtureKey, {
    global: {
      fetch: async (input) => {
        const url = new URL(String(input));
        assert.equal(url.searchParams.get("status"), "eq.ACCEPTED");
        assert.equal(url.searchParams.get("user_id"), `eq.${fixtureUserId}`);
        assert.equal(
          url.searchParams.get("company_id"),
          `eq.${fixtureCompanyId}`,
        );
        assert.equal(
          url.searchParams.get("thought_id"),
          `eq.${fixtureThoughtId}`,
        );
        assert.equal(url.searchParams.get("or"), null);
        return Response.json(duplicate ? [accepted, accepted] : [accepted]);
      },
    },
  });
  assert.equal(
    (
      await getActiveRefinement(
        client,
        fixtureUserId,
        fixtureCompanyId,
        fixtureThoughtId,
        "ACCEPTED",
      )
    )?.user_final_content,
    "Pilihan milikku.",
  );
  duplicate = true;
  await assert.rejects(() =>
    getActiveRefinement(
      client,
      fixtureUserId,
      fixtureCompanyId,
      fixtureThoughtId,
      "ACCEPTED",
    ),
  );
});
test("bounded queue reads mark unseen truncated history unknown and perform only scoped GETs", async () => {
  const another = randomUUID();
  const accepted = row("ACCEPTED");
  let calls = 0;
  const client = createClient(fixtureUrl, fixtureKey, {
    global: {
      fetch: async (input, init) => {
        calls++;
        const url = new URL(String(input));
        assert.equal(init?.method ?? "GET", "GET");
        assert.equal(url.searchParams.get("user_id"), `eq.${fixtureUserId}`);
        assert.equal(
          url.searchParams.get("company_id"),
          `eq.${fixtureCompanyId}`,
        );
        assert.ok(url.searchParams.get("thought_id")?.includes(another));
        return Response.json(
          url.pathname.endsWith("refinement_requests")
            ? []
            : url.searchParams.get("status")
              ? [accepted]
              : Array.from({ length: 101 }, () => row("REJECTED")),
        );
      },
    },
  });
  const queue = await getRefinementQueue(
    client,
    fixtureUserId,
    fixtureCompanyId,
    [fixtureThoughtId, another],
  );
  assert.equal(calls, 3);
  assert.equal(
    queueLabel(queue.get(fixtureThoughtId)!.statuses, false),
    "Versi diterima",
  );
  assert.equal(queue.get(another)!.statuses, null);
});
