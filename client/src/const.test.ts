import { describe, expect, it } from "vitest";
import { getOAuthPortalUrl } from "./const";

describe("getOAuthPortalUrl", () => {
  it("usa o portal configurado e remove barras finais", () => {
    expect(getOAuthPortalUrl("https://login.example.com///")).toBe("https://login.example.com");
  });

  it("usa o portal Manus quando a configuração está ausente ou inválida", () => {
    expect(getOAuthPortalUrl()).toBe("https://manus.im");
    expect(getOAuthPortalUrl("manus.im")).toBe("https://manus.im");
    expect(getOAuthPortalUrl("   ")).toBe("https://manus.im");
  });
});
