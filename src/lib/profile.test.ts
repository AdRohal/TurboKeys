import { describe, expect, it } from "vitest";
import { safeNext, splitFullName, validateName, validateUsername } from "./profile.ts";

describe("validateUsername", () => {
  it("accepts 3 to 30 letters, digits, underscore, dot and dash", () => {
    for (const ok of ["abc", "Ada_99", "a.b-c", "x".repeat(30)]) expect(validateUsername(ok)).toBeNull();
  });
  it("explains what is wrong", () => {
    expect(validateUsername("ab")).toMatch(/at least 3/);
    expect(validateUsername("x".repeat(31))).toMatch(/30/);
    expect(validateUsername("has space")).toMatch(/letters, numbers/);
    expect(validateUsername("emoji😀")).toMatch(/letters, numbers/);
    expect(validateUsername("")).toMatch(/required/i);
  });
});

describe("validateName", () => {
  it("allows empty or up to 50 characters", () => {
    expect(validateName("")).toBeNull();
    expect(validateName("x".repeat(50))).toBeNull();
    expect(validateName("x".repeat(51))).toMatch(/50/);
  });
});

describe("splitFullName", () => {
  it("first word is the first name, the rest the last name", () => {
    expect(splitFullName("Grace Brewster Hopper")).toEqual({ firstName: "Grace", lastName: "Brewster Hopper" });
    expect(splitFullName("  Madonna  ")).toEqual({ firstName: "Madonna", lastName: "" });
    expect(splitFullName("")).toEqual({ firstName: "", lastName: "" });
  });
});

describe("safeNext: where to go after signing in", () => {
  it("keeps same-site paths and refuses anything that could leave the site", () => {
    expect(safeNext("/history")).toBe("/history");
    expect(safeNext("/a?b=1")).toBe("/a?b=1");
    for (const bad of ["//evil.com", "https://evil.com", "/" + String.fromCharCode(92) + "evil.com","javascript:alert(1)", "", null, undefined]) expect(safeNext(bad as never)).toBe("/");
  });
});
