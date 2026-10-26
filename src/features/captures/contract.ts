import { z } from "zod";

export const captureTextLimit = 8000;
// Validate without transforming: original whitespace, Unicode and line breaks are data.
export const rawCaptureText = z
  .string()
  .refine(
    (text) =>
      text.trim().length > 0 &&
      Array.from(text).length <= captureTextLimit &&
      !text.includes("\0") &&
      text.isWellFormed(),
    "Isi catatan 1–8.000 karakter, tanpa karakter yang tidak didukung.",
  );
export const captureInput = z
  .object({
    request_id: z.uuid(),
    raw_text: rawCaptureText,
    company_id: z.uuid().nullable(),
  })
  .strict();
export const captureRow = captureInput
  .extend({
    id: z.uuid(),
    user_id: z.uuid(),
    created_at: z.iso.datetime({ offset: true }),
  })
  .strict();
export type Capture = z.infer<typeof captureRow>;
export type CaptureItem = Capture & { company_name: string | null };
export type CaptureInboxState = {
  ready: boolean;
  failed: boolean;
  items: CaptureItem[];
  page: number;
  hasNext: boolean;
};
export const capturePageSize = 20;
export const capturePage = z.number().int().min(0).max(10000);
export function parseCapturePage(value: unknown) {
  if (typeof value !== "string" || !/^\d{1,5}$/.test(value)) return 0;
  const parsed = capturePage.safeParse(Number(value));
  return parsed.success ? parsed.data : 0;
}
export function captureHref(page = 0) {
  const p = capturePage.parse(page);
  return `/foundation?view=captures${p ? `&capture_page=${p}` : ""}`;
}
export function captureTime(value: string) {
  // Explicit UTC prevents server/browser timezone hydration differences.
  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(new Date(value)) + " UTC"
  );
}
