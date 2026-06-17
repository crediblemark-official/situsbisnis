const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXTAUTH_URL,
  ...(process.env.NODE_ENV === "development"
    ? ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"]
    : []),
].filter(Boolean) as string[];

export function validateCsrf(req: Request): { valid: boolean; reason?: string } {
  if (process.env.NODE_ENV === "test") {
    return { valid: true };
  }

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (origin) {
    if (!ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed))) {
      return { valid: false, reason: "Invalid origin" };
    }
  } else if (referer) {
    if (!ALLOWED_ORIGINS.some((allowed) => referer.startsWith(allowed))) {
      return { valid: false, reason: "Invalid referer" };
    }
  } else if (process.env.NODE_ENV !== "development") {
    return { valid: false, reason: "Missing origin and referer" };
  }

  return { valid: true };
}
