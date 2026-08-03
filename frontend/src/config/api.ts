import { env } from "./env";

export const API_CONFIG = {
  BASE_URL: env.API_URL || "http://localhost:5000/api/v1",
  TIMEOUT: 15000,
  HEADERS: {
    "Content-Type": "application/json",
  },
};
