/** Disposable development-only visual QA. Every AI response is injected locally. */
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "../src/lib/env/public.ts";
import { getSupabaseSecretKey } from "../src/server/db/config.ts";
import { createCompany, archiveCompany } from "../src/server/db/companies.ts";
import { createThought } from "../src/server/db/thoughts.ts";
import { ensureUserSettings } from "../src/server/db/user-settings.ts";
import { createAIAccounting } from "../src/server/db/ai-runs.ts";
import {
  createRefinementWriter,
  claimRefinement,
  resolveRefinement,
} from "../src/server/db/refinements.ts";
import { createRefineService } from "../src/server/refinements/service.ts";
import {
  aiResponse,
  fixtureAIConfig,
} from "../src/tests/helpers/ai-fixture.ts";
import { refineResponseText } from "../src/tests/helpers/refine-fixture.ts";

assert.equal(process.env.MY_KRAVV_LIVE_TESTS, "development");
const file = ".env.phase-1-visual-fixture.json";
const purpose = "Disposable Milestone 5.5 Phase 1 visual QA";
const { url, publishableKey } = getPublicSupabaseConfig();
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, getSupabaseSecretKey(), options);
const client = createClient(url, publishableKey, options);
type Fixture = {
  id: string;
  email: string;
  password: string;
  company?: string;
  emptyCompany?: string;
  archivedCompany?: string;
  refinePath?: string;
  longRefinePath?: string;
  manyCompany?: string;
  oldestThought?: string;
  newestThought?: string;
  readingThoughts?: { id: string; raw_content: string }[];
  refineStates?: Record<string, string>;
  refineCheckpoint?: {
    runs: number;
    originals: { id: string; raw_content: string }[];
  };
};
const mode = process.argv[2];
if (mode === "setup") {
  const email = `my-kravv-visual-${randomUUID()}@example.invalid`;
  const password = randomBytes(32).toString("base64url");
  const result = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { purpose },
  });
  assert.ok(
    !result.error && result.data.user,
    "Disposable account setup failed.",
  );
  writeFileSync(
    file,
    JSON.stringify({ id: result.data.user.id, email, password }),
  );
  console.log(
    "Disposable empty visual QA account prepared; credentials remain local and ignored.",
  );
} else {
  const f = JSON.parse(readFileSync(file, "utf8")) as Fixture;
  const identity = await admin.auth.admin.getUserById(f.id);
  assert.equal(
    identity.data.user?.user_metadata.purpose,
    purpose,
    "Only this disposable QA account may be used.",
  );
  if (mode === "cleanup") {
    assert.ok(
      !(await admin.auth.admin.deleteUser(f.id)).error,
      "Fixture cleanup failed.",
    );
    for (const table of [
      "companies",
      "thoughts",
      "refinements",
      "refinement_requests",
      "ai_runs",
      "ai_run_attempts",
      "timeline_events",
      "user_settings",
    ]) {
      const r = await admin.from(table).select("user_id").eq("user_id", f.id);
      assert.ok(
        !r.error && r.data.length === 0,
        "Fixture cascade cleanup incomplete.",
      );
    }
    unlinkSync(file);
    console.log(
      "Disposable fixture and credential file removed; cascade cleanup verified.",
    );
  } else if (mode === "refine-checkpoint" || mode === "refine-verify") {
    assert.ok(f.refineStates);
    assert.ok(
      !(
        await client.auth.signInWithPassword({
          email: f.email,
          password: f.password,
        })
      ).error,
    );
    const runs = await client.from("ai_runs").select("id").eq("user_id", f.id);
    const originals = await client
      .from("thoughts")
      .select("id,raw_content")
      .eq("user_id", f.id)
      .order("id");
    assert.ok(!runs.error && !originals.error && runs.data && originals.data);
    if (mode === "refine-checkpoint") {
      assert.ok(!f.refineCheckpoint);
      assert.equal(runs.data.length, 27);
      f.refineCheckpoint = {
        runs: runs.data.length,
        originals: originals.data,
      };
      writeFileSync(file, JSON.stringify(f));
    } else {
      assert.ok(f.refineCheckpoint);
      assert.equal(runs.data.length, f.refineCheckpoint.runs);
      assert.deepEqual(originals.data, f.refineCheckpoint.originals);
    }
    console.log(
      "Disposable Refine run count and exact original content checkpoint verified; no provider requests.",
    );
  } else if (mode === "refine-workspace") {
    assert.ok(
      f.company && !f.refineStates,
      "Prepare the base disposable fixture once first.",
    );
    assert.ok(
      !(
        await client.auth.signInWithPassword({
          email: f.email,
          password: f.password,
        })
      ).error,
    );
    const service = createRefineService({
      configuration: () => ({
        ...fixtureAIConfig,
        outputTokenLimit: 512,
        dailyCallLimit: 60,
        pricingVersion: "synthetic-refine-workspace-qa",
      }),
      accounting: () => createAIAccounting(admin),
      writer: () => createRefinementWriter(admin),
      provider: () => ({
        async generate() {
          return aiResponse(
            JSON.stringify(
              refineResponseText(
                "aku tertarik sama ekspansinya. aku belum memeriksa laporan arus kasnya, jadi belum tahu apakah mereka siap.\n\nAku mau lihat laporannya dulu.",
              ),
            ),
          );
        },
      }),
    });
    const states: Record<string, string> = {};
    for (const name of [
      "accepted",
      "rejected",
      "multiple",
      "pending",
      "long",
    ]) {
      const thought = await createThought(client, f.id, {
        company_id: f.company,
        capture_operation_id: randomUUID(),
        raw_content:
          name === "long"
            ? Array.from(
                { length: 6 },
                (_, i) =>
                  `${i + 1}. aku belum cek laporan arus kasnya. ekspansinya menarik, tapi aku belum tahu apakah mereka siap. aku ingin memeriksa dokumennya dulu.`,
              ).join("\n\n")
            : `aku tertarik sama ekspansinya (${name}, fiktif). aku belum memeriksa laporan arus kasnya, jadi belum tahu apakah mereka siap.\n\nAku mau lihat laporannya dulu.`,
      });
      states[name] = `/companies/${f.company}/thoughts/${thought.id}/refine`;
      if (name === "pending") {
        await claimRefinement(
          client,
          f.id,
          f.company,
          thought.id,
          randomUUID(),
        );
        continue;
      }
      const proposal = await service(client, {
        company_id: f.company,
        thought_id: thought.id,
        operation_id: randomUUID(),
      });
      if (name === "accepted" || name === "multiple")
        await resolveRefinement(
          client,
          f.id,
          proposal,
          "ACCEPTED",
          "aku masih tertarik. aku belum memeriksa laporannya; itu yang ingin aku lakukan dulu.\n\nIni versi pilihan yang kusunting sendiri.",
        );
      if (name === "rejected")
        await resolveRefinement(client, f.id, proposal, "REJECTED", null);
      if (name === "multiple") {
        const newer = await service(client, {
          company_id: f.company,
          thought_id: thought.id,
          operation_id: randomUUID(),
        });
        await resolveRefinement(
          client,
          f.id,
          newer,
          "ACCEPTED",
          "Versi pilihan terbaru milikku. aku belum baca laporannya, jadi belum tahu.",
        );
        for (let i = 0; i < 21; i++)
          await service(client, {
            company_id: f.company,
            thought_id: thought.id,
            operation_id: randomUUID(),
          });
        states.outOfWindow = `${states[name]}?proposal=${proposal.id}#refinement-${proposal.id}`;
      }
    }
    f.refineStates = states;
    writeFileSync(file, JSON.stringify(f));
    console.log(
      "Disposable accepted/edited/rejected/superseded/pending/long and off-page states prepared. All provider responses injected locally.",
    );
  } else if (mode === "phase-3-history") {
    assert.ok(
      f.company && !f.manyCompany,
      "Populate the base fixture once before expanding history.",
    );
    assert.ok(
      !(
        await client.auth.signInWithPassword({
          email: f.email,
          password: f.password,
        })
      ).error,
    );
    const company = await createCompany(client, f.id, {
      name: "Loka Distribusi — Riwayat Fiktif",
      ticker: "",
      exchange: "",
      sector: "",
      short_note: "",
    });
    const rows = await client
      .from("thoughts")
      .insert(
        Array.from({ length: 25 }, (_, i) => ({
          user_id: f.id,
          company_id: company.id,
          raw_content: `Catatan fiktif ${i + 1}: aku belum memeriksa laporan arus kasnya. Aku tertarik dengan ekspansinya, tapi masih perlu membaca sumbernya dulu.`,
          capture_operation_id: randomUUID(),
        })),
      )
      .select("id,created_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: true });
    assert.ok(
      !rows.error && rows.data?.length === 25,
      "History fixture failed.",
    );
    Object.assign(f, {
      manyCompany: company.id,
      newestThought: rows.data[0].id,
      oldestThought: rows.data.at(-1)!.id,
    });
    writeFileSync(file, JSON.stringify(f));
    console.log("25 disposable original Thoughts prepared; no AI request.");
  } else if (mode === "phase-3-reading") {
    assert.ok(
      f.company && !f.readingThoughts,
      "Prepare the base fixture once first.",
    );
    assert.ok(
      !(
        await client.auth.signInWithPassword({
          email: f.email,
          password: f.password,
        })
      ).error,
    );
    const texts = [
      "aku tertarik sama ekspansinya, tapi belum baca laporan terakhir. jangan buru-buru menyimpulkan.",
      "Yang perlu aku cek:\n\n- arus kas operasional\n- kebutuhan modal untuk ekspansi\n- catatan utang yang jatuh tempo\n\naku belum punya jawaban untuk ketiganya.",
      Array.from(
        { length: 5 },
        (_, i) =>
          `${i + 1}. aku mau bedakan rencana ekspansi dari hasil yang sudah terlihat. Belum membaca laporannya bukan berarti aku meragukan semua rencana mereka; aku masih perlu melihat informasinya dulu.`,
      ).join("\n\n"),
      "hari ini aku cuma ingin menyimpan pertanyaan: ekspansinya dibiayai dari mana? belum ada kesimpulan.",
    ];
    f.readingThoughts = [];
    for (const raw_content of texts) {
      const thought = await createThought(client, f.id, {
        company_id: f.company,
        raw_content,
        capture_operation_id: randomUUID(),
      });
      f.readingThoughts.push({ id: thought.id, raw_content });
    }
    writeFileSync(file, JSON.stringify(f));
    console.log(
      "Four disposable short/multiline/long reading fixtures prepared; no AI request.",
    );
  } else {
    assert.equal(mode, "populate");
    assert.ok(!f.company, "Do not populate an existing fixture twice.");
    assert.ok(
      !(
        await client.auth.signInWithPassword({
          email: f.email,
          password: f.password,
        })
      ).error,
    );
    await ensureUserSettings(client, f.id);
    const metadata = { ticker: "", exchange: "", sector: "", short_note: "" };
    const company = await createCompany(client, f.id, {
      ...metadata,
      name: "Rimba Nusa Pangan — Ruang Penelitian Fiktif untuk Memeriksa Ekspansi, Arus Kas Operasional, dan Pertanyaan yang Belum Terjawab",
      sector: "Pangan · data fiktif",
      short_note:
        "Catatan fiktif: aku ingin membaca laporan keuangannya dulu. Ini hanya data untuk memeriksa tata letak.",
    });
    const empty = await createCompany(client, f.id, {
      ...metadata,
      name: "Arunika Logistik — Fiktif",
    });
    const archived = await createCompany(client, f.id, {
      ...metadata,
      name: "Sagara Karya — Arsip Fiktif",
    });
    const raw =
      "menurutku ekspansi perusahaan ini menarik sih, tapi agak terlalu cepet. aku belum lihat apakah cash flow mereka cukup kuat buat dukung ekspansi itu. mungkin aku perlu cek laporan keuangannya dulu sebelum punya kesimpulan.";
    const thought = await createThought(client, f.id, {
      company_id: company.id,
      raw_content: raw,
      capture_operation_id: randomUUID(),
    });
    const long = await createThought(client, f.id, {
      company_id: company.id,
      raw_content:
        Array.from(
          { length: 14 },
          (_, i) =>
            `${i + 1}. aku belum cek laporan keuangannya. Expansion pace menarik, tapi aku belum tahu apakah arus kasnya cukup kuat. Ini pengamatan fiktif, bukan kesimpulan yang terverifikasi.`,
        ).join("\n\n") +
        "\n" +
        "pengamatanyangbelumdiperiksa".repeat(18),
      capture_operation_id: randomUUID(),
    });
    await createThought(client, f.id, {
      company_id: archived.id,
      raw_content:
        "Catatan fiktif di ruang arsip; teks asli tetap bisa dibaca.",
      capture_operation_id: randomUUID(),
    });
    await archiveCompany(client, f.id, archived.id);
    let calls = 0;
    const service = createRefineService({
      configuration: () => ({
        ...fixtureAIConfig,
        outputTokenLimit: 512,
        pricingVersion: "synthetic-phase-1-visual-qa",
      }),
      accounting: () => createAIAccounting(admin),
      writer: () => createRefinementWriter(admin),
      provider: () => ({
        async generate() {
          calls++;
          return aiResponse(
            JSON.stringify(
              refineResponseText(
                "Menurutku ekspansi ini menarik, tapi kayaknya terlalu cepat. Aku belum memeriksa apakah arus kas mereka cukup kuat buat mendukungnya. Mungkin aku perlu cek laporan keuangannya dulu sebelum punya kesimpulan.",
              ),
            ),
          );
        },
      }),
    });
    await service(client, {
      company_id: company.id,
      thought_id: thought.id,
      operation_id: randomUUID(),
    });
    assert.equal(
      calls,
      1,
      "Only one local mock response is needed for this fixture.",
    );
    Object.assign(f, {
      company: company.id,
      emptyCompany: empty.id,
      archivedCompany: archived.id,
      refinePath: `/companies/${company.id}/thoughts/${thought.id}/refine`,
      longRefinePath: `/companies/${company.id}/thoughts/${long.id}/refine`,
    });
    writeFileSync(file, JSON.stringify(f));
    console.log(
      "Fictional Company/Thought/archived/review fixtures prepared with one local mock response; zero real AI calls.",
    );
  }
}
