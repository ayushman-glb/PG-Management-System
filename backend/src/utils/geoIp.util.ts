import { Request } from "express";

export interface ResolvedLocation {
  ip: string;
  city: string;
  region: string;
  country: string;
  latitude?: number;
  longitude?: number;
  formattedLocation: string;
  isLocal: boolean;
}

export class GeoIpUtil {
  /**
   * Extracts clean client IP address from Express Request
   */
  public static extractClientIp(req: Request): string {
    const forwarded = req.headers["x-forwarded-for"];
    let rawIp: string;

    if (forwarded) {
      const parts = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
      rawIp = parts.trim();
    } else if (req.headers["x-real-ip"]) {
      rawIp = Array.isArray(req.headers["x-real-ip"])
        ? req.headers["x-real-ip"][0]
        : (req.headers["x-real-ip"] as string);
    } else if (req.headers["cf-connecting-ip"]) {
      rawIp = req.headers["cf-connecting-ip"] as string;
    } else {
      rawIp = req.ip || req.socket?.remoteAddress || "127.0.0.1";
    }

    // Strip IPv6 prefix if mapped IPv4 (e.g. ::ffff:127.0.0.1 -> 127.0.0.1)
    if (rawIp.startsWith("::ffff:")) {
      rawIp = rawIp.substring(7);
    }
    if (rawIp === "::1") {
      rawIp = "127.0.0.1";
    }

    return rawIp;
  }

  /**
   * Checks if an IP is a private/local/loopback address
   */
  public static isLocalOrPrivateIp(ip: string): boolean {
    if (!ip) return true;
    const clean = ip.trim().toLowerCase();
    if (
      clean === "127.0.0.1" ||
      clean === "::1" ||
      clean === "localhost" ||
      clean === "0.0.0.0" ||
      clean.startsWith("192.168.") ||
      clean.startsWith("10.") ||
      clean.startsWith("172.16.") ||
      clean.startsWith("172.17.") ||
      clean.startsWith("172.18.") ||
      clean.startsWith("172.19.") ||
      clean.startsWith("172.2") ||
      clean.startsWith("172.30.") ||
      clean.startsWith("172.31.")
    ) {
      return true;
    }
    return false;
  }

  /**
   * Resolves IP to geographic details with resilient fallbacks for local and production
   */
  public static resolveLocation(ip: string, reqHeaders?: Record<string, any>): ResolvedLocation {
    const isLocal = this.isLocalOrPrivateIp(ip);

    // If Cloudflare / CDN headers provide country/city, leverage them
    const cfCountry = reqHeaders?.["cf-ipcountry"] || reqHeaders?.["x-country-code"];
    const cfCity = reqHeaders?.["cf-ipcity"] || reqHeaders?.["x-city"];
    const cfRegion = reqHeaders?.["cf-region"] || reqHeaders?.["x-region"];

    if (cfCountry || cfCity) {
      const city = String(cfCity || "Unknown City");
      const region = String(cfRegion || "Unknown Region");
      const country = String(cfCountry || "Unknown Country");
      return {
        ip,
        city,
        region,
        country,
        formattedLocation: `${city}, ${region}, ${country}`,
        isLocal: false,
      };
    }

    if (isLocal) {
      return {
        ip: ip || "127.0.0.1",
        city: "Localhost",
        region: "Local Development",
        country: "Local Network",
        latitude: 12.9716,
        longitude: 77.5946,
        formattedLocation: "Localhost (Local Development)",
        isLocal: true,
      };
    }

    // Default production fallback for public IP when direct GeoIP is offline
    return {
      ip,
      city: "Detected Location",
      region: "Region Network",
      country: "Online",
      formattedLocation: `Location for ${ip}`,
      isLocal: false,
    };
  }
}
