import { describe, expect, it } from "vitest";
import { extractSupabaseBearerToken } from "./supabase";

describe("Supabase bearer authentication", () => {
  it("extracts a JWT from a standard Authorization header", () => {
    expect(extractSupabaseBearerToken("Bearer jwt-token-123")).toBe("jwt-token-123");
    expect(extractSupabaseBearerToken("bearer jwt-token-456")).toBe("jwt-token-456");
  });

  it("rejects missing or malformed authorization headers", () => {
    expect(extractSupabaseBearerToken()).toBeNull();
    expect(extractSupabaseBearerToken("Basic abc")).toBeNull();
    expect(extractSupabaseBearerToken("Bearer")).toBeNull();
  });
});
