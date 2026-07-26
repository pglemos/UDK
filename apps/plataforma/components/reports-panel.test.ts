import { describe, expect, it } from "vitest";
import { createCsv, sanitizeReportRows } from "./reports-panel";

describe("report exports", () => {
  it("neutralizes spreadsheet formulas", () => {
    const csv = createCsv([{ pilot: "=HYPERLINK(\"https://example.test\")", number: "+5511999999999" }]);

    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("'+5511999999999");
  });

  it("does not export non-finite numbers as spreadsheet values", () => {
    const csv = createCsv([{ valid: 12.5, notANumber: Number.NaN, infinity: Number.POSITIVE_INFINITY }]);

    expect(csv).toContain('"12.5"');
    expect(csv).not.toContain("NaN");
    expect(csv).not.toContain("Infinity");
  });

  it("removes private storage paths and soft-deletion metadata", () => {
    expect(
      sanitizeReportRows("documents", [
        {
          id: "document-1",
          status: "approved",
          original_path: "user/private-document.pdf",
          deleted_at: null,
        },
      ]),
    ).toEqual([{ id: "document-1", status: "approved" }]);

    expect(
      sanitizeReportRows("payments", [
        {
          id: "payment-1",
          status: "approved",
          proof_path: "user/payment-proof.pdf",
          deleted_at: null,
        },
      ]),
    ).toEqual([{ id: "payment-1", status: "approved" }]);
  });
});
