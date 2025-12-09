import { describe, expect, it } from "vitest";

import { formatDisplayTime } from "~/lib/coding-session/time";

describe("formatDisplayTime", () => {
  // Test seconds, no hours
  it("should format seconds correctly (MM:SS)", () => {
    const result = formatDisplayTime(45000); // 45 seconds = 0m 45s
    expect(result).toBe("00:45");
  });

  // Test minutes and seconds, no hours
  it("should format minutes and seconds correctly (MM:SS)", () => {
    const result = formatDisplayTime(125000); // 125000ms = 125s = 2m 5s
    expect(result).toBe("02:05");
  });

  // Test full format with hours, minutes, and seconds
  it("should format hours, minutes, and seconds correctly (HH:MM:SS)", () => {
    const result = formatDisplayTime(3665000); // 3665000ms = 3665s = 1h 1m 5s
    expect(result).toBe("01:01:05");
  });

  // Test edge case for zero padding for seconds
  it("should pad single digit seconds", () => {
    const result = formatDisplayTime(5000); // 5 seconds
    expect(result).toBe("00:05");
  });

  // Test edge case for zero padding for minutes
  it("should pad single digit minutes", () => {
    const result = formatDisplayTime(65000); // 65 seconds = 1m 5s
    expect(result).toBe("01:05");
  });

  // Test edge case for exactly zero
  it("should handle zero milliseconds", () => {
    const result = formatDisplayTime(0);
    expect(result).toBe("00:00");
  });

  // Test boundary where exactly one hour should show hours segment
  it("should handle exactly one hour", () => {
    const result = formatDisplayTime(3600000); // 3600000ms = 3600s = 1h
    expect(result).toBe("01:00:00");
  });

  // Test boundary where just under one hour should NOT show hours segment
  it("should not show hours for times under one hour", () => {
    const result = formatDisplayTime(3599000); // 3599000ms = 3599s = 59m 59s
    expect(result).toBe("59:59");
  });
});
