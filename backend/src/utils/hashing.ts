import crypto from "crypto";
import { env } from "../config/env";

/**
 * Enterprise Cryptographic Hashing Utilities
 * 
 * Provides unified, salted SHA-256 hashing for low-entropy network and device identifiers
 * (Visitor ID, IP Address, User Agent) utilizing environment-configured secret salts.
 */

export const hashVisitorId = (visitorId: string): string => {
  const salt = env.DEVICE_VISITOR_SALT || "roombae_default_visitor_salt_32_chars!";
  return crypto
    .createHash("sha256")
    .update(`${salt}_${visitorId}`)
    .digest("hex");
};

export const hashIpAddress = (ipAddress?: string): string | undefined => {
  if (!ipAddress) return undefined;
  const salt = env.DEVICE_IP_SALT || "roombae_default_ip_salt_32_chars!";
  return crypto
    .createHash("sha256")
    .update(`${salt}_${ipAddress.trim()}`)
    .digest("hex");
};

export const hashUserAgent = (userAgent?: string): string | undefined => {
  if (!userAgent) return undefined;
  const salt = env.DEVICE_UA_SALT || "roombae_default_ua_salt_32_chars!";
  return crypto
    .createHash("sha256")
    .update(`${salt}_${userAgent.trim()}`)
    .digest("hex");
};
