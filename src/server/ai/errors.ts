import "server-only";

export const errorMessages = {
  UNAUTHENTICATED: "Silakan masuk kembali sebelum menggunakan AI.",
  UNAUTHORIZED: "Konteks tidak tersedia untuk permintaan ini.",
  INVALID_REQUEST: "Permintaan AI tidak valid atau terlalu besar.",
  ROLE_NOT_READY: "Peran AI ini belum tersedia.",
  CONFIGURATION_MISSING: "Konfigurasi AI belum lengkap.",
  API_KEY_MISSING: "Kunci penyedia AI belum dikonfigurasi.",
  MODEL_MISSING: "Model AI belum dikonfigurasi.",
  PRICING_UNAVAILABLE:
    "Estimasi biaya AI belum dapat dikonfigurasi dengan aman.",
  AI_DISABLED: "AI dinonaktifkan. Catatan tetap dapat digunakan.",
  BUDGET_EXHAUSTED:
    "Batas anggaran AI bulan ini tercapai. Catatan tetap tersedia.",
  RATE_LIMIT: "Batas permintaan AI tercapai. Silakan coba lagi nanti.",
  PROVIDER_TIMEOUT: "Penyedia AI tidak merespons tepat waktu.",
  PROVIDER_RATE_LIMIT: "Penyedia AI sedang membatasi permintaan.",
  PROVIDER_UNAVAILABLE:
    "Penyedia AI belum tersedia. Silakan lanjut secara manual.",
  PROVIDER_REJECTED:
    "Penyedia AI tidak dapat menerima konfigurasi permintaan ini.",
  INVALID_PROVIDER_RESPONSE: "Hasil AI belum memenuhi format yang diperlukan.",
  UNKNOWN_USAGE: "Penggunaan atau biaya AI belum dapat dipastikan.",
  DATABASE_LOGGING_FAILED:
    "Status permintaan AI belum dapat dipastikan. Jangan langsung mengulanginya.",
} as const;
export type AIErrorCode = keyof typeof errorMessages;
export type ProviderErrorCode = Extract<
  AIErrorCode,
  `PROVIDER_${string}` | "INVALID_PROVIDER_RESPONSE" | "UNKNOWN_USAGE"
>;
export class AIError extends Error {
  readonly code: AIErrorCode;
  constructor(code: AIErrorCode) {
    super(errorMessages[code]);
    this.code = code;
  }
}
export function safeError(error: unknown) {
  const code =
    error instanceof AIError ? error.code : "DATABASE_LOGGING_FAILED";
  return { code, message: errorMessages[code] };
}
