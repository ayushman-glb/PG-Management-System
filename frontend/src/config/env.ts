const isDev = import.meta.env.DEV ?? import.meta.env.MODE === "development";
const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

export const env = {
  API_URL:
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    (isLocalhost || isDev
      ? "http://localhost:5000/api/v1"
      : ""),
  SOCKET_URL:
    import.meta.env.VITE_SOCKET_URL ||
    (isLocalhost || isDev
      ? "http://localhost:5000"
      : ""),
  MODE: import.meta.env.MODE ?? (isDev ? "development" : "production"),
  IS_DEV: isDev,
  IS_PROD: !isDev,
};

export const getApiUrl = (path = "") =>
  `${env.API_URL.replace(/\/$/, "")}${path}`;
