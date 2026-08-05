const isDev = import.meta.env.DEV ?? import.meta.env.MODE === "development";

export const env = {
  API_URL:
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    (isDev
      ? "http://localhost:5000/api/v1"
      : "https://pg-management-system-boxb.onrender.com/api/v1"),
  GRAPHQL_URL:
    import.meta.env.VITE_GRAPHQL_URL ||
    (isDev
      ? "http://localhost:5000/graphql"
      : "https://pg-management-system-boxb.onrender.com/graphql"),
  SOCKET_URL:
    import.meta.env.VITE_SOCKET_URL ||
    (isDev
      ? "http://localhost:5000"
      : "https://pg-management-system-boxb.onrender.com"),
  MODE: import.meta.env.MODE ?? (isDev ? "development" : "production"),
  IS_DEV: isDev,
  IS_PROD: !isDev,
  RECAPTCHA_SITE_KEY:
    import.meta.env.VITE_RECAPTCHA_SITE_KEY ||
    "6LfgNnYtAAAAAABdvCLaqfA6ucDLdBKTxy8sLCwfn",
};

export const getApiUrl = (path = "") =>
  `${env.API_URL.replace(/\/$/, "")}${path}`;
