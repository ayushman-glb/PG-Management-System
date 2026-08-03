export const env = {
  API_URL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1",
  GRAPHQL_URL: import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:5000/graphql",
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL ?? "http://localhost:5000",
  MODE: import.meta.env.MODE ?? "development",
  IS_DEV: import.meta.env.DEV ?? false,
  IS_PROD: import.meta.env.PROD ?? false,
};
