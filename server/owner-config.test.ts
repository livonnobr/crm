import { describe, expect, it } from "vitest";

describe("owner workspace configuration", () => {
  it("exposes a valid owner email for server-side workspace resolution", () => {
    const ownerEmail = process.env.OWNER_EMAIL ?? "";
    expect(ownerEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});
