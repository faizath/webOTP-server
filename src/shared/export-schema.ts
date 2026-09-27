import type { OtpEntry } from "./otp-entry.ts";

/** Mirrors webOTP ExportSchema v1; only encrypted VaultEnvelope data is stored. */
export interface ExportSchema {
  version: 1;
  exportedAt: string;
  entries: OtpEntry[];
}
