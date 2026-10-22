import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { v3ApiUrl, v3AppUrl, v3ProjectId } from "../../lib/env/v3.ts";
import {
  verifyLayout,
  validateDisposable,
  verifyApiIdentity,
  statePath,
  dbContainer,
} from "../../../scripts/v3/guards.ts";
import { listFoundationCompanies } from "../../server/foundation/service.ts";
import { runPortableFoundationTests } from "../helpers/v3-portable.ts";

test(
  "V3 Slice 0 isolated database, Auth, RLS and HTTP Server Actions",
  { timeout: 180000 },
  async (t) => {
    // Fail (never skip/pass) if invoked outside the guarded local runner.
    assert.equal(
      process.env.MY_KRAVV_V3_INTEGRATION,
      v3ProjectId,
      "Use npm run v3:test.",
    );
    assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, v3ApiUrl);
    assert.equal(process.env.MY_KRAVV_TEST_APP_URL, v3AppUrl);
    verifyLayout();
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    const secret = process.env.SUPABASE_SECRET_KEY!;
    assert.ok(
      key?.startsWith("sb_publishable_") && secret?.startsWith("sb_secret_"),
      "Local keys unavailable.",
    );
    await verifyApiIdentity(key);
    function sql(query: string) {
      const proof = JSON.parse(fs.readFileSync(statePath, "utf8"));
      const run = (...args: string[]) => {
        try {
          return execFileSync(
            "docker",
            ["--context", "desktop-linux", ...args],
            {
              encoding: "utf8",
              timeout: 10000,
              maxBuffer: 1024 * 1024,
              windowsHide: true,
              stdio: ["ignore", "pipe", "pipe"],
            },
          ).trim();
        } catch {
          throw Error(
            "Identified V3 SQL check unavailable; stop Docker-dependent work.",
          );
        }
      };
      assert.equal(proof.project, v3ProjectId);
      assert.equal(
        run("inspect", "--format", "{{.Id}}", dbContainer),
        proof.container,
      );
      assert.equal(
        run(
          "inspect",
          "--format",
          '{{index .Config.Labels "com.supabase.cli.project"}}',
          dbContainer,
        ),
        v3ProjectId,
      );
      return run(
        "exec",
        dbContainer,
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-At",
        "-v",
        "ON_ERROR_STOP=1",
        "-c",
        query,
      );
    }
    const disposable = JSON.parse(
      sql(`select jsonb_build_object('identity',public.v3_target_identity(),
    'foreign_users',(select count(*) from auth.users where email !~ '^v3-slice0-.*@example.invalid$'
      or raw_user_meta_data->>'purpose' is distinct from 'my-kravv-v3-slice0'),
    'unexpected_tables',(select count(*) from pg_tables where schemaname='public' and tablename not in ('companies','user_settings')));`),
    );
    validateDisposable(disposable);

    await runPortableFoundationTests(
      t,
      {
        kind: "local",
        apiUrl: v3ApiUrl,
        appUrl: v3AppUrl,
        projectId: v3ProjectId,
        fixturePurpose: "my-kravv-v3-slice0",
      },
      async ({ clients, created, accounts }) => {
        await t.test(
          "RLS/grants and C1: no delete/archive/legacy RPC; restrictive FK pattern",
          async () => {
            const catalog = JSON.parse(
              sql(`select jsonb_build_object(
        'rls',(select bool_and(relrowsecurity) from pg_class where oid in ('public.companies'::regclass,'public.user_settings'::regclass)),
        'delete',has_table_privilege('authenticated','public.companies','DELETE'),
        'owner_update',has_column_privilege('authenticated','public.companies','user_id','UPDATE'),
        'archive',(select count(*) from information_schema.columns where table_schema='public' and table_name='companies' and column_name in ('state','archived_at')),
        'legacy',(select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('delete_company','delete_thought','capture_thought')));`),
            );
            assert.deepEqual(catalog, {
              rls: true,
              delete: false,
              owner_update: false,
              archive: 0,
              legacy: 0,
            });
            assert.ok(
              (
                await clients[0]
                  .from("companies")
                  .delete()
                  .eq("id", created[0].id)
              ).error,
            );
            assert.ok(
              (
                await clients[0].rpc("delete_company", {
                  p_company_id: created[0].id,
                  p_confirmed: true,
                  p_company_name: created[0].name,
                })
              ).error,
            );
            // Temporary synthetic probe rolls back in the same transaction; no domain table added.
            for (const value of [created[0].id, accounts[0].id])
              assert.match(value, /^[a-f0-9-]{36}$/);
            sql(`begin; create table v3_internal.c1_probe(company_id uuid,user_id uuid,
        foreign key(company_id,user_id) references public.companies(id,user_id) on delete restrict);
        insert into v3_internal.c1_probe values('${created[0].id}','${accounts[0].id}');
        do $$ begin
          begin delete from public.companies where id='${created[0].id}';
          exception when foreign_key_violation then return; end;
          raise exception 'Restrictive child FK failed';
        end $$; rollback;`);
            assert.equal((await listFoundationCompanies(clients[0])).length, 1);
          },
        );
      },
    );
  },
);
