import { describe, expect, it } from "vitest";

import { cn } from "~/lib/utils";

describe("cn utility function", () => {
  it("should merge class names correctly", () => {
    const result = cn("px-4", "py-2");
    expect(result).toBe("px-4 py-2");
  });

  it("should handle undefined and null values", () => {
    const result = cn("base", undefined, null, "extra");
    expect(result).toBe("base extra");
  });

  it("should handle empty input", () => {
    const result = cn();
    expect(result).toBe("");
  });
});
