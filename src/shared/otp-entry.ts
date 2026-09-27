/** Mirrors the webOTP extension contract; the server never stores these entries. */
export type OtpEntryType = "totp" | "hotp";

export interface OtpEntry {
  name: string;
  account: string;
  secret: string;
  digits: number;
  period: number;
  type: OtpEntryType;
  counter?: number;
  algorithm?: string;
  URI: string[];
  notes?: string;
}
