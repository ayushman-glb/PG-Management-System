const isDev = import.meta.env.DEV ?? import.meta.env.MODE === "development";
const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "0.0.0.0");

const DEFAULT_PROD_HOST = "https://pg-management-system-boxb.onrender.com";

const getCleanApiBaseUrl = (): string => {
  const raw =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    (isLocalhost || isDev ? "http://localhost:5000/api/v1" : `${DEFAULT_PROD_HOST}/api/v1`);

  let clean = String(raw).trim().replace(/\/+$/, "");
  // Ensure /api/v1 prefix is cleanly appended if missing
  if (!clean.endsWith("/api/v1")) {
    if (clean.endsWith("/api")) {
      clean = `${clean}/v1`;
    } else {
      clean = `${clean}/api/v1`;
    }
  }
  return clean;
};

const getCleanSocketUrl = (): string => {
  const raw =
    import.meta.env.VITE_SOCKET_URL ||
    (isLocalhost || isDev ? "http://localhost:5000" : DEFAULT_PROD_HOST);

  return String(raw)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/v1$/, "")
    .replace(/\/api$/, "");
};

export const env = {
  API_URL: getCleanApiBaseUrl(),
  SOCKET_URL: getCleanSocketUrl(),
  MODE: import.meta.env.MODE ?? (isDev ? "development" : "production"),
  IS_DEV: isDev,
  IS_PROD: !isDev,
};

export const getApiUrl = (path = ""): string => {
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${env.API_URL}${cleanPath}`;
};
