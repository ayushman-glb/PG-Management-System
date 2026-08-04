import { env } from "./env";

export const API_CONFIG = {
  BASE_URL: env.API_URL,
  TIMEOUT: 15000,
  HEADERS: {
    "Content-Type": "application/json",
  },
};
