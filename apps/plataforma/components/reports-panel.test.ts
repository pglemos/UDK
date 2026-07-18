import { describe, expect, it } from "vitest";
import { createCsv, sanitizeReportRows } from "./reports-panel";

describe("report exports", () => {
  it("neutralizes spreadsheet formulas", () => {
    const csv = createCsv([{ pilot: "=HYPERLINK(\"https://example.test\")", number: "+5511999999999" }]);

    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("'+5511999999999");
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
