import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Draft,
  ThoughtVersion,
} from "../../features/research/contract.ts";
import type { ResearchAIRun } from "../../features/research/reasoning-contract.ts";
export const A = "20000000-0000-4000-8000-000000000001",
  B = "20000000-0000-4000-8000-000000000002";
export const uuid = (n: number) =>
  `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export function researchFixture() {
  let actor: string | null = A,
    n = 20;
  const companies = [
    {
      id: uuid(1),
      user_id: A,
      name: "Synthetic A",
      ticker: "SYN",
      exchange: null,
      sector: null,
      short_note: null,
    },
    {
      id: uuid(2),
      user_id: B,
      name: "Synthetic B",
      ticker: null,
      exchange: null,
      sector: null,
      short_note: null,
    },
  ];
  const captures = [
    {
      id: uuid(3),
      user_id: A,
      raw_text: "  Pertanyaan 😀\n\nHipotesis belum pasti.  ",
      company_id: uuid(1),
    },
  ];
  const drafts: Draft[] = [],
    versions: ThoughtVersion[] = [],
    runs: ResearchAIRun[] = [];
  const receipts = new Map<string, { payload: string; value: unknown }>(),
    journal: {
      name: string;
      args?: Record<string, unknown>;
      filters?: [string, unknown][];
    }[] = [];
  const stamp = () => new Date(1800000000000 + n++).toISOString();
  const failure = (message = "Research unavailable") => ({
    data: null,
    error: { code: "P0001", message },
  });
  let queue = Promise.resolve();
  const client = {
    auth: {
      getUser: async () => ({
        data: { user: actor ? { id: actor } : null },
        error: null,
      }),
    },
    rpc: async (name: string, args?: Record<string, unknown>) => {
      journal.push({ name, args: structuredClone(args) });
      if (
        [
          "v3_research_contract",
          "v3_research_ai_contract",
          "v3_company_management_contract",
        ].includes(name)
      )
        return { data: 1, error: null };
      let unlock!: () => void;
      const previous = queue;
      queue = new Promise((resolve) => {
        unlock = resolve;
      });
      await previous;
      try {
        if (!actor || !args) return failure();
        const key = actor + ":" + args.p_operation,
          payload = JSON.stringify({ name, args }),
          old = receipts.get(key);
        if (old)
          return old.payload === payload
            ? { data: structuredClone(old.value), error: null }
            : failure("Research operation conflict");
        let value: unknown;
        if (name === "v3_create_research") {
          if (
            args.p_company &&
            !companies.some(
              (c) => c.id === args.p_company && c.user_id === actor,
            )
          )
            return failure();
          const source = args.p_capture
            ? captures.find(
                (c) => c.id === args.p_capture && c.user_id === actor,
              )
            : null;
          if (args.p_capture && !source) return failure();
          let d = source
            ? drafts.find(
                (d) => d.source_capture_id === source.id && d.user_id === actor,
              )
            : undefined;
          if (!d) {
            d = {
              id: uuid(n++),
              user_id: actor,
              title: String(args.p_title),
              body: source?.raw_text ?? "",
              company_id: args.p_company as string | null,
              mode: args.p_mode as Draft["mode"],
              revision: 1,
              source_capture_id: source?.id ?? null,
              created_at: stamp(),
              updated_at: stamp(),
            };
            drafts.push(d);
          }
          value = { id: d.id, revision: d.revision };
        } else {
          const d = drafts.find(
            (d) => d.id === args.p_draft && d.user_id === actor,
          );
          if (!d) return failure();
          if (d.revision !== args.p_expected)
            return failure("Research revision conflict");
          if (name === "v3_save_research") {
            if (
              args.p_company &&
              !companies.some(
                (c) => c.id === args.p_company && c.user_id === actor,
              )
            )
              return failure();
            Object.assign(d, {
              title: args.p_title,
              body: args.p_body,
              mode: args.p_mode,
              company_id: args.p_company,
              revision: d.revision + 1,
              updated_at: stamp(),
            });
            value = { id: d.id, revision: d.revision };
          } else if (name === "v3_commit_research") {
            const previous = versions.filter((v) => v.draft_id === d.id).at(-1);
            if ((previous?.number ?? 0) !== args.p_latest)
              return failure("Research revision conflict");
            if (
              !d.body.trim() ||
              (previous &&
                previous.title === d.title &&
                previous.body === d.body &&
                previous.company_id === d.company_id)
            )
              return failure("Research already committed");
            const v: ThoughtVersion = {
              id: uuid(n++),
              user_id: actor,
              draft_id: d.id,
              thought_id: previous?.thought_id ?? uuid(n++),
              number: (previous?.number ?? 0) + 1,
              draft_revision: d.revision,
              title: d.title,
              body: d.body,
              company_id: d.company_id,
              message: String(args.p_message),
              created_at: stamp(),
            };
            versions.push(Object.freeze(v));
            value = { id: v.id, revision: v.number };
          } else if (name === "v3_restore_research") {
            const v = versions.find(
              (v) =>
                v.id === args.p_version &&
                v.draft_id === d.id &&
                v.user_id === actor,
            );
            if (!v) return failure();
            Object.assign(d, {
              title: v.title,
              body: v.body,
              company_id: v.company_id,
              revision: d.revision + 1,
              updated_at: stamp(),
            });
            value = { id: d.id, revision: d.revision };
          } else return failure();
        }
        receipts.set(key, { payload, value: structuredClone(value) });
        return { data: structuredClone(value), error: null };
      } finally {
        unlock();
      }
    },
    from(name: string) {
      const filters: [string, unknown][] = [],
        orders: [string, boolean][] = [];
      let range = [0, 100],
        limit = 100,
        columns = "";
      const execute = () => {
        journal.push({ name, filters: structuredClone(filters) });
        const tables: Record<string, unknown[]> = {
          research_drafts: drafts,
          research_versions: versions,
          research_ai_runs: runs,
          companies,
          captures,
        };
        let rows = (tables[name] ?? []).filter((v) => {
          const r = v as Record<string, unknown>;
          return (
            actor &&
            r.user_id === actor &&
            filters.every(([k, v]) =>
              Array.isArray(v) ? v.includes(r[k]) : r[k] === v,
            )
          );
        }) as Record<string, unknown>[];
        for (const [key, ascending] of orders.toReversed())
          rows = rows.toSorted(
            (a, b) =>
              (typeof a[key] === "number"
                ? Number(a[key]) - Number(b[key])
                : String(a[key]).localeCompare(String(b[key]))) *
              (ascending ? 1 : -1),
          );
        rows = rows.slice(range[0], range[1] + 1).slice(0, limit);
        return {
          data: rows.map((r) =>
            Object.fromEntries(columns.split(",").map((k) => [k, r[k]])),
          ),
          error: null,
        };
      };
      const q = {
        select(v: string) {
          columns = v;
          return this;
        },
        eq(k: string, v: unknown) {
          filters.push([k, v]);
          return this;
        },
        in(k: string, v: unknown[]) {
          filters.push([k, v]);
          return this;
        },
        order(k: string, o: { ascending?: boolean } = {}) {
          orders.push([k, o.ascending !== false]);
          return this;
        },
        range(a: number, b: number) {
          range = [a, b];
          return this;
        },
        limit(v: number) {
          limit = v;
          return this;
        },
        async maybeSingle() {
          const r = execute();
          return { ...r, data: r.data[0] ?? null };
        },
        then(resolve: (v: unknown) => unknown) {
          return Promise.resolve(execute()).then(resolve);
        },
      };
      return q;
    },
  };
  return {
    client: client as unknown as SupabaseClient,
    drafts,
    versions,
    runs,
    captures,
    companies,
    journal,
    receipts,
    setActor: (v: string | null) => {
      actor = v;
    },
    stamp,
  };
}
