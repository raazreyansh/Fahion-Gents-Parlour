import { describe, expect, it } from "vitest";
import { calculateServiceTotal, serviceCatalog } from "./services.js";

describe("service catalog", () => {
  it("contains the complete PRD price board", () => {
    expect(serviceCatalog).toHaveLength(16);
    expect(serviceCatalog.map((service) => service.id)).toContain("facial-shahnaz");
  });

  it("calculates multi-service total price and duration", () => {
    const total = calculateServiceTotal(["haircut", "beard-setting", "hair-spa"]);

    expect(total.priceInr).toBe(400);
    expect(total.durationMinutes).toBe(70);
  });

  it("rejects unknown services", () => {
    expect(() => calculateServiceTotal(["missing"])).toThrow("Unknown or inactive service");
  });
});
