import { describe, expect, it } from "vitest";

import { distance } from "~/lib/coding-session/dom";

describe("distance", () => {
  it("returns zero when points are identical", () => {
    expect(distance(5, -3, 5, -3)).toBe(0);
  });

  it("calculates horizontal distance", () => {
    expect(distance(0, 0, 7, 0)).toBe(7);
  });

  it("calculates diagonal distance using the Pythagorean theorem", () => {
    expect(distance(-2, -3, 1, 1)).toBeCloseTo(5, 10);
  });
});
