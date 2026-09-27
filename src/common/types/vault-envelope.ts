export interface VaultEnvelope {
  version: 2;
  salt: string;
  ciphertext: string;
}
