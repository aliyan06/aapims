import { describe, expect, it } from "vitest";
import { isBenignAbort } from "@/server";

describe("isBenignAbort", () => {
  it("treats a Node socket reset as a benign client abort", () => {
    const error = Object.assign(new Error("aborted"), { code: "ECONNRESET" });
    expect(isBenignAbort(error)).toBe(true);
  });

  it("treats an AbortError as a benign client abort", () => {
    const error = new Error("The operation was aborted");
    error.name = "AbortError";
    expect(isBenignAbort(error)).toBe(true);
  });

  it("matches an 'aborted' message without a code", () => {
    expect(isBenignAbort(new Error("aborted"))).toBe(true);
  });

  it("follows a wrapped cause", () => {
    const cause = Object.assign(new Error("socket hang up"), { code: "ECONNRESET" });
    const error = new Error("request failed", { cause });
    expect(isBenignAbort(error)).toBe(true);
  });

  it("does not treat a real application error as an abort", () => {
    expect(isBenignAbort(new TypeError("cannot read properties of undefined"))).toBe(false);
    expect(isBenignAbort(undefined)).toBe(false);
    expect(isBenignAbort("boom")).toBe(false);
  });
});
