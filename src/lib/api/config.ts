export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8004/api/v1";

export const API_ORIGIN = new URL(API_URL).origin;
