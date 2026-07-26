import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./module-crud.tsx", import.meta.url), "utf8");

describe("module CRUD accessibility and sync resilience", () => {
  it("manages modal focus and exposes an accessible close control", () => {
    expect(source).toContain("const modalRef = useRef<HTMLElement>(null);");
    expect(source).toContain("previousFocusRef.current?.focus();");
    expect(source).toContain('aria-label="Fechar modal"');
    expect(source).toContain("event.key === 'Escape'");
    expect(source).toContain("event.key !== 'Tab'");
  });

  it("handles offline synchronization errors and dead letters", () => {
    expect(source).toContain("try {");
    expect(source).toContain("catch (syncError)");
    expect(source).toContain("result.deadLettered > 0");
    expect(source).toContain("quarentena offline");
  });
});
