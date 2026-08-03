export const env = {
  API_URL:
    import.meta.env.VITE_API_URL ??
    "https://pg-management-system-boxb.onrender.com/api/v1",
  GRAPHQL_URL:
    import.meta.env.VITE_GRAPHQL_URL ??
    "https://pg-management-system-boxb.onrender.com/graphql",
  SOCKET_URL:
    import.meta.env.VITE_SOCKET_URL ??
    "https://pg-management-system-boxb.onrender.com",
  MODE: import.meta.env.MODE ?? "production",
  IS_DEV: import.meta.env.DEV ?? false,
  IS_PROD: import.meta.env.PROD ?? true,
};

export const getApiUrl = (path = "") =>
  `${env.API_URL.replace(/\/$/, "")}${path}`;
