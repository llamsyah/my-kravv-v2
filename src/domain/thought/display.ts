import { z } from "zod";
import type { Thought } from "./thought.ts";
import { refinementRow, type Refinement } from "../refinement/refinement.ts";

export const displayPreferenceSchema = z
  .object({
    thought_id: z.uuid(),
    user_id: z.uuid(),
    company_id: z.uuid(),
    source: z.enum(["ORIGINAL", "REFINEMENT"]),
    refinement_id: z.uuid().nullable(),
    revision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    updated_at: z.iso.datetime({ offset: true }),
  })
  .refine((r) =>
    r.source === "ORIGINAL"
      ? r.refinement_id === null
      : r.refinement_id !== null,
  );
export type DisplayPreference = z.infer<typeof displayPreferenceSchema>;
export const displayInputSchema = z
  .object({
    company_id: z.uuid(),
    thought_id: z.uuid(),
    source: z.enum(["ORIGINAL", "REFINEMENT"]),
    refinement_id: z.uuid().nullable(),
    expected_revision: z
      .number()
      .int()
      .min(0)
      .max(Number.MAX_SAFE_INTEGER - 1),
  })
  .refine((r) =>
    r.source === "ORIGINAL"
      ? r.refinement_id === null
      : r.refinement_id !== null,
  );
export type ThoughtDisplay = {
  source: "ORIGINAL" | "REFINEMENT" | "UNAVAILABLE";
  text: string;
  preference: DisplayPreference | null;
  selected: Refinement | null;
  hasApproved: boolean;
  label: string;
};
export type DisplayedThought = Thought & { display: ThoughtDisplay };
export function unavailableDisplay(thought: Thought): ThoughtDisplay {
  return {
    source: "UNAVAILABLE",
    text: thought.raw_content,
    preference: null,
    selected: null,
    hasApproved: false,
    label: "Asli · pilihan belum tersedia",
  };
}
const displayResultSchema = z.object({
  thought_id: z.uuid(),
  user_id: z.uuid(),
  company_id: z.uuid(),
  preference: displayPreferenceSchema.nullable(),
  selected_refinement: refinementRow.nullable(),
  has_approved: z.boolean(),
});
/** Never guess from acceptance recency. Recovery raw is labeled as raw, not chosen. */
export function projectThoughtDisplay(
  thought: Thought,
  value: unknown,
): ThoughtDisplay {
  const parsed = displayResultSchema.safeParse(value);
  if (!parsed.success) return unavailableDisplay(thought);
  const r = parsed.data;
  const owned = (v: {
    user_id: string;
    company_id: string;
    thought_id: string;
  }) =>
    v.user_id === thought.user_id &&
    v.company_id === thought.company_id &&
    v.thought_id === thought.id;
  if (!owned(r) || (r.preference && !owned(r.preference)))
    return unavailableDisplay(thought);
  const p = r.preference,
    selected = r.selected_refinement;
  if (!p || p.source === "ORIGINAL") {
    if (selected !== null) return unavailableDisplay(thought);
    return {
      source: "ORIGINAL",
      text: thought.raw_content,
      preference: p,
      selected: null,
      hasApproved: r.has_approved,
      label: "Asli",
    };
  }
  if (
    !selected ||
    !owned(selected) ||
    selected.id !== p.refinement_id ||
    !["ACCEPTED", "SUPERSEDED"].includes(selected.status) ||
    selected.resolved_at === null ||
    !r.has_approved
  )
    return unavailableDisplay(thought);
  return {
    source: "REFINEMENT",
    text: selected.user_final_content ?? selected.ai_content,
    preference: p,
    selected,
    hasApproved: true,
    label:
      selected.user_final_content !== null
        ? "Hasil Refine · Kamu sunting"
        : "Hasil Refine",
  };
}
export type DisplayFormState = { error: string | null; target?: string };
export const initialDisplayFormState: DisplayFormState = { error: null };
