import {
  createClient,
  AuthSessionMissingError,
  type User,
} from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import type {
  Refinement,
  RefinementRequest,
} from "../../domain/refinement/refinement.ts";
import type { RefinementWriter } from "../../server/db/refinements.ts";
import { fixtureUrl, fixtureKey, fixtureUserId } from "./auth-fixture.ts";
import {
  fixtureCompanyId,
  fixtureThoughtId,
  fixtureAIConfig,
} from "./ai-fixture.ts";

export function refineFixture(
  options: {
    anonymous?: boolean;
    owner?: string;
    company?: string;
    missing?: boolean;
    archived?: boolean;
    raw?: string;
    disabled?: boolean;
    writerFailure?: boolean;
  } = {},
) {
  const owner = options.owner ?? fixtureUserId;
  const raw =
    options.raw ??
    "  ekspansinya agresif banget, tapi aku belum yakin cash flow mereka sanggup.\nApa mungkin temporary?";
  const created = "2026-10-08T00:00:00.000Z";
  const company = {
    id: fixtureCompanyId,
    user_id: owner,
    name: "Synthetic context",
    ticker: null,
    exchange: null,
    sector: null,
    short_note: "PRIVATE unrelated company note",
    state: options.archived ? "ARCHIVED" : "EXPLORING",
    archived_at: options.archived ? created : null,
    created_at: created,
    updated_at: created,
  };
  const thought = {
    id: fixtureThoughtId,
    user_id: owner,
    company_id: options.company ?? fixtureCompanyId,
    raw_content: raw,
    intent: null,
    created_at: created,
    capture_operation_id: null,
  };
  const requests = new Map<string, RefinementRequest>();
  const refinements: Refinement[] = [];
  const queries: {
    url: string;
    method: string;
    body?: Record<string, unknown>;
  }[] = [];
  const client = createClient(fixtureUrl, fixtureKey, {
    auth: { persistSession: false },
    global: {
      fetch: async (input, init) => {
        const url = new URL(String(input));
        const body = init?.body
          ? (JSON.parse(String(init.body)) as Record<string, unknown>)
          : undefined;
        queries.push({ url: url.href, method: init?.method ?? "GET", body });
        const name = url.pathname.split("/").at(-1);
        if (name === "companies")
          return Response.json(options.missing ? null : company);
        if (name === "thoughts")
          return Response.json(
            options.missing
              ? null
              : url.searchParams.get("id")?.startsWith("eq.")
                ? thought
                : [thought],
          );
        if (name === "user_settings")
          return Response.json({
            user_id: owner,
            ai_enabled: !options.disabled,
            guidance_mode: "ADAPTIVE",
            challenge_intensity: "STANDARD",
          });
        if (name === "claim_refinement_request" && body) {
          const op = String(body.p_operation_id);
          const previous = requests.get(op);
          if (previous)
            return Response.json({ request: previous, claimed: false });
          if (options.archived)
            return Response.json(
              { message: "REFINEMENT_ARCHIVED" },
              { status: 403 },
            );
          if ([...requests.values()].some((r) => r.status === "PENDING"))
            return Response.json(
              { message: "REFINEMENT_BUSY" },
              { status: 409 },
            );
          const row: RefinementRequest = {
            id: op,
            user_id: owner,
            company_id: fixtureCompanyId,
            thought_id: fixtureThoughtId,
            status: "PENDING",
            ai_run_id: null,
            error_code: null,
            created_at: created,
            completed_at: null,
          };
          requests.set(op, row);
          return Response.json({ request: row, claimed: true });
        }
        if (name === "refinements") {
          const id = url.searchParams.get("id")?.slice(3);
          const op = url.searchParams.get("generation_request_id")?.slice(3);
          return Response.json(
            id || op
              ? (refinements.find((r) =>
                  id ? r.id === id : r.generation_request_id === op,
                ) ?? null)
              : refinements,
          );
        }
        if (name === "resolve_refinement" && body) {
          const row = refinements.find((r) => r.id === body.p_refinement_id)!;
          if (row.status !== "SUGGESTED")
            return Response.json(
              { message: "REFINEMENT_ALREADY_RESOLVED" },
              { status: 409 },
            );
          if (body.p_status === "ACCEPTED")
            for (const old of refinements)
              if (old.status === "ACCEPTED") old.status = "SUPERSEDED";
          row.status = body.p_status as "ACCEPTED" | "REJECTED";
          row.user_final_content =
            body.p_user_final_content === row.ai_content
              ? null
              : (body.p_user_final_content as string | null);
          row.resolved_at = created;
          return Response.json(row);
        }
        throw new Error("Unexpected Refine fixture query.");
      },
    },
  });
  client.auth.getUser = async () =>
    options.anonymous
      ? { data: { user: null }, error: new AuthSessionMissingError() }
      : { data: { user: { id: fixtureUserId } as User }, error: null };
  const writer: RefinementWriter = {
    async complete(value) {
      if (options.writerFailure) throw new Error("private database detail");
      const row = requests.get(value.operation)!;
      row.status = value.error ? "FAILED" : "SUCCEEDED";
      row.error_code = value.error;
      row.ai_run_id = value.runId;
      row.completed_at = created;
      if (!value.error)
        refinements.unshift({
          id: randomUUID(),
          user_id: owner,
          company_id: fixtureCompanyId,
          thought_id: fixtureThoughtId,
          generation_request_id: value.operation,
          ai_run_id: value.runId,
          ai_content: value.content!,
          user_final_content: null,
          status: "SUGGESTED",
          prompt_version: "refine-v1",
          output_schema_version: "refine-schema-v1",
          provider: "groq",
          model: fixtureAIConfig.model,
          warnings: value.warnings,
          created_at: created,
          resolved_at: null,
        });
      return row;
    },
  };
  return {
    client,
    raw,
    company,
    thought,
    requests,
    refinements,
    queries,
    writer,
  };
}
export function refineResponseText(
  text = "Ekspansinya agresif, tapi aku belum yakin arus kasnya sanggup. Apa mungkin temporary?",
) {
  return {
    schema_version: "1",
    role: "REFINE",
    status: "OK",
    data: {
      refined_text: text,
      preserved_uncertainty: true,
      meaning_changed: false,
    },
    warnings: [],
  };
}
