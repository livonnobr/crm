import { describe, expect, it } from "vitest";

describe("Supabase backend credentials", () => {
  it("authenticates against the REST endpoint without writing data", async () => {
    const baseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(baseUrl).toMatch(/^https:\/\/[^/]+\.supabase\.co$/);
    expect(serviceRoleKey).toMatch(/^eyJ/);

    const response = await fetch(`${baseUrl}/rest/v1/`, {
      headers: {
        apikey: serviceRoleKey!,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    expect(response.status).toBe(200);
  }, 15_000);
});
