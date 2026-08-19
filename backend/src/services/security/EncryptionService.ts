import crypto from "crypto";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";

export interface ParsedEnvelope {
  version: string;
  keyId: string;
  iv: Buffer;
  tag: Buffer;
  ciphertext: string;
}

/**
 * Enterprise AES-256-GCM Reusable Field-Level Envelope Encryption Service
 * 
 * Implements authenticated encryption with associated data (AEAD) using AES-256-GCM
 * with key lifecycle and rotation management.
 * 
 * Envelope Format:
 * `v1:<keyId>:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>`
 * (Also supports backwards-compatible format `v1:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>` assuming keyId "v1").
 */
export class EncryptionService {
  private static readonly ALGORITHM = "aes-256-gcm";
  private static readonly CURRENT_VERSION = "v1";
  private static readonly DEFAULT_KEY_ID = "v1";
  private static readonly IV_LENGTH_BYTES = 12; // 96-bit IV
  private static readonly AUTH_TAG_LENGTH_BYTES = 16; // 128-bit authentication tag

  private static keyMap: Map<string, Buffer> = new Map();

  /**
   * Retrieves active key ID from environment or defaults to "v1"
   */
  public static getActiveKeyId(): string {
    return process.env.ACTIVE_ENCRYPTION_KEY || this.DEFAULT_KEY_ID;
  }

  /**
   * Derives a deterministic 32-byte (256-bit) encryption key for a given keyId.
   */
  public static getKey(keyId?: string): Buffer {
    const id = keyId || this.getActiveKeyId();
    if (this.keyMap.has(id)) {
      return this.keyMap.get(id)!;
    }

    let rawSecret: string | undefined;

    if (id === "v1") {
      rawSecret =
        process.env.ENCRYPTION_MASTER_KEY_V1 ||
        process.env.ENCRYPTION_SECRET ||
        process.env.JWT_SECRET ||
        env.JWT_SECRET;
    } else if (id === "v2") {
      rawSecret =
        process.env.ENCRYPTION_MASTER_KEY_V2 ||
        process.env.ENCRYPTION_SECRET_V2;
    } else {
      rawSecret = process.env[`ENCRYPTION_MASTER_KEY_${id.toUpperCase()}`];
    }

    if (!rawSecret) {
      rawSecret = `roombae_secure_enterprise_master_key_${id}_32b_secret`;
    }

    // SHA-256 ensures a strict 32-byte (256-bit) key buffer
    const derivedKey = crypto.createHash("sha256").update(rawSecret).digest();
    this.keyMap.set(id, derivedKey);
    return derivedKey;
  }

  /**
   * Parses an envelope into its constituent components.
   */
  public static parseEnvelope(envelope: string): ParsedEnvelope {
    const parts = envelope.split(":");

    // 5-part format: v1:keyId:iv:tag:ciphertext
    if (parts.length === 5 && parts[0] === this.CURRENT_VERSION) {
      return {
        version: parts[0],
        keyId: parts[1],
        iv: Buffer.from(parts[2], "hex"),
        tag: Buffer.from(parts[3], "hex"),
        ciphertext: parts[4],
      };
    }

    // 4-part legacy format: v1:iv:tag:ciphertext (default keyId "v1")
    if (parts.length === 4 && parts[0] === this.CURRENT_VERSION) {
      return {
        version: parts[0],
        keyId: this.DEFAULT_KEY_ID,
        iv: Buffer.from(parts[1], "hex"),
        tag: Buffer.from(parts[2], "hex"),
        ciphertext: parts[3],
      };
    }

    throw new Error(`Invalid encryption envelope structure: ${envelope.substring(0, 20)}...`);
  }

  /**
   * Encrypts plaintext string using AES-256-GCM with the active or specified key.
   * Returns: `v1:<keyId>:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>`
   */
  public static encrypt(plaintext: string | null | undefined, keyId?: string): string {
    if (!plaintext || typeof plaintext !== "string" || plaintext.trim() === "") {
      return plaintext || "";
    }

    // If already encrypted, return as-is
    if (this.isEncrypted(plaintext)) {
      return plaintext;
    }

    try {
      const targetKeyId = keyId || this.getActiveKeyId();
      const key = this.getKey(targetKeyId);
      const iv = crypto.randomBytes(this.IV_LENGTH_BYTES);
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv, {
        authTagLength: this.AUTH_TAG_LENGTH_BYTES,
      });

      let ciphertext = cipher.update(plaintext, "utf8", "hex");
      ciphertext += cipher.final("hex");
      const authTag = cipher.getAuthTag().toString("hex");

      return `${this.CURRENT_VERSION}:${targetKeyId}:${iv.toString("hex")}:${authTag}:${ciphertext}`;
    } catch (err: any) {
      logger.error("Encryption failed for field", { error: err.message });
      throw new Error(`Data encryption failed: ${err.message}`);
    }
  }

  /**
   * Decrypts an AES-256-GCM envelope string.
   * Gracefully returns plaintext if the input is unencrypted legacy data.
   */
  public static decrypt(envelope: string | null | undefined): string {
    if (!envelope || typeof envelope !== "string" || envelope.trim() === "") {
      return envelope || "";
    }

    // If not matching envelope format, return as unencrypted legacy value
    if (!this.isEncrypted(envelope)) {
      return envelope;
    }

    try {
      const parsed = this.parseEnvelope(envelope);
      const key = this.getKey(parsed.keyId);

      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, parsed.iv, {
        authTagLength: this.AUTH_TAG_LENGTH_BYTES,
      });
      decipher.setAuthTag(parsed.tag);

      let decrypted = decipher.update(parsed.ciphertext, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (err: any) {
      logger.error("Decryption failed for envelope", { error: err.message });
      throw new Error(`Data decryption failed: authentication tag mismatch or corrupted ciphertext`);
    }
  }

  /**
   * Rotates an encrypted envelope from an old key to a new target key.
   */
  public static rotate(envelope: string, targetKeyId?: string): string {
    const activeTarget = targetKeyId || this.getActiveKeyId();
    if (!this.isEncrypted(envelope)) {
      return this.encrypt(envelope, activeTarget);
    }

    const parsed = this.parseEnvelope(envelope);
    if (parsed.keyId === activeTarget) {
      return envelope; // Already using target key
    }

    const decrypted = this.decrypt(envelope);
    return this.encrypt(decrypted, activeTarget);
  }

  /**
   * Checks whether a string matches any valid envelope format.
   */
  public static isEncrypted(value: string | null | undefined): boolean {
    if (!value || typeof value !== "string") return false;
    const parts = value.split(":");
    if (parts[0] !== this.CURRENT_VERSION) return false;

    // 5-part format: v1:keyId:iv:tag:ciphertext
    if (
      parts.length === 5 &&
      parts[2].length === this.IV_LENGTH_BYTES * 2 &&
      parts[3].length === this.AUTH_TAG_LENGTH_BYTES * 2
    ) {
      return true;
    }

    // 4-part legacy format: v1:iv:tag:ciphertext
    if (
      parts.length === 4 &&
      parts[1].length === this.IV_LENGTH_BYTES * 2 &&
      parts[2].length === this.AUTH_TAG_LENGTH_BYTES * 2
    ) {
      return true;
    }

    return false;
  }

  /**
   * Batch encrypts specified sensitive fields inside an object.
   */
  public static encryptObject<T extends Record<string, any>>(data: T, sensitiveFields: (keyof T)[]): T {
    if (!data || typeof data !== "object") return data;
    const result = { ...data };

    for (const field of sensitiveFields) {
      if (result[field] && typeof result[field] === "string") {
        (result as any)[field] = this.encrypt(result[field] as string);
      }
    }

    return result;
  }

  /**
   * Batch decrypts specified sensitive fields inside an object.
   */
  public static decryptObject<T extends Record<string, any>>(data: T, sensitiveFields: (keyof T)[]): T {
    if (!data || typeof data !== "object") return data;
    const result = { ...data };

    for (const field of sensitiveFields) {
      if (result[field] && typeof result[field] === "string") {
        (result as any)[field] = this.decrypt(result[field] as string);
      }
    }

    return result;
  }
}
