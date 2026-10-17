"use client";
import { useActionState, useId, useState } from "react";
import type { DisplayedThought } from "@/domain/thought/display";
import { initialDisplayFormState } from "@/domain/thought/display";
import type { Refinement } from "@/domain/refinement/refinement";
import { saveThoughtDisplayAction } from "./display-actions";
import styles from "./thought-display.module.css";
import { RefineComparison } from "@/features/refinements/refine-comparison";
import { reviewLabels } from "@/features/refinements/presentation";

/** Preview state is local. Only the explicit submit reaches the persistent RPC. */
export function DisplaySelector({
  thought,
  versions,
  initialPreview,
  confirmed,
  permalink,
  compact = false,
}: {
  thought: DisplayedThought;
  versions: Refinement[];
  initialPreview?: string;
  confirmed: boolean;
  permalink: string;
  compact?: boolean;
}) {
  const display = thought.display;
  const current = display.preference?.refinement_id ?? "ORIGINAL";
  const [state, action, pending] = useActionState(
    saveThoughtDisplayAction,
    initialDisplayFormState,
    permalink,
  );
  const [preview, setPreview] = useState(
    state.target ?? initialPreview ?? current,
  );
  const id = useId();
  const target = preview;
  const row = versions.find((r) => r.id === target);
  const different = target !== current;
  return (
    <section
      id="thought-display"
      className={styles.panel}
      data-secondary={compact}
      aria-labelledby={`${id}-title`}
    >
      <h3 id={`${id}-title`}>Ditampilkan · {display.label}</h3>
      {display.selected && (
        <p className={styles.reviewStatus}>
          {reviewLabels[display.selected.status]} · keputusan tinjauan
        </p>
      )}
      {compact ? (
        <details className={styles.currentReading}>
          <summary>Lihat bacaan tersimpan</summary>
          <div className={styles.reading}>{display.text}</div>
        </details>
      ) : display.source === "REFINEMENT" ? (
        <RefineComparison
          original={thought.raw_content}
          proposal={display.text}
          label="Versi pilihan"
          originalAnchor
        />
      ) : (
        <div
          id="original-title"
          className={`${styles.reading} ${styles.primaryReading}`}
        >
          {display.text}
        </div>
      )}
      {confirmed && (
        <p className="thought-success" role="status">
          Tampilan tersimpan.
        </p>
      )}
      <details
        className={styles.choice}
        open={
          different || !!state.error || initialPreview !== undefined
            ? true
            : undefined
        }
      >
        <summary>Ubah versi bacaan</summary>
        <form
          id="thought-display-form"
          action={action}
          aria-busy={pending}
          // Action completion otherwise resets the native select behind preview state.
          // A confirmed save navigates to a fresh server-owned selection instead.
          onReset={(event) => event.preventDefault()}
        >
          <input type="hidden" name="company_id" value={thought.company_id} />
          <input type="hidden" name="thought_id" value={thought.id} />
          <input
            type="hidden"
            name="expected_revision"
            value={display.preference?.revision ?? 0}
          />
          <div className={styles.controls}>
            <label htmlFor={`${id}-version`}>
              Versi bacaan
              <select
                id={`${id}-version`}
                name="display_version"
                value={target}
                onChange={(e) => setPreview(e.target.value)}
                disabled={pending}
              >
                <option value="ORIGINAL">
                  Asli{current === "ORIGINAL" ? " · Ditampilkan" : ""}
                </option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    Hasil Refine ·{" "}
                    {new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "medium",
                      timeZone: "Asia/Jakarta",
                    }).format(new Date(v.resolved_at!))}
                    {v.user_final_content !== null ? " · Kamu sunting" : ""}
                    {v.id === current ? " · Ditampilkan" : ""}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="secondary-button"
              disabled={pending || (target !== "ORIGINAL" && !row)}
            >
              {pending ? "Menyimpan…" : "Gunakan versi ini"}
            </button>
          </div>
        </form>
        {different && (row || target === "ORIGINAL") && (
          <details className={styles.preview} open>
            <summary>Pratinjau · {row ? "Hasil Refine" : "Asli"}</summary>
            <div className={styles.reading}>
              {row
                ? (row.user_final_content ?? row.ai_content)
                : thought.raw_content}
            </div>
          </details>
        )}
      </details>
      <p role="status" className="form-feedback" aria-live="polite">
        {state.error}
      </p>
    </section>
  );
}
