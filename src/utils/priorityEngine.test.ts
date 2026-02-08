import { describe, expect, it } from "vitest";
import { calculatePriority } from "./priorityEngine";

const zeroFactors = {
  blocking: 0,
  urgency: 0,
  impact: 0,
  omissionCost: 0,
  alignment: 0,
  mentalLoad: 0,
  quickWin: 0
} as const;

const maxFactors = {
  blocking: 2,
  urgency: 2,
  impact: 2,
  omissionCost: 2,
  alignment: 2,
  mentalLoad: 2,
  quickWin: 2
} as const;

describe("priorityEngine", () => {
  it("returns Backlog for minimum score", () => {
    const result = calculatePriority(zeroFactors);
    expect(result.totalScore).toBe(0);
    expect(result.level).toBe("Backlog");
  });

  it("returns Critical for maximum score", () => {
    const result = calculatePriority(maxFactors);
    expect(result.totalScore).toBe(14);
    expect(result.level).toBe("Critical");
  });

  it("returns Steady Flow for mid-range score", () => {
    const result = calculatePriority({
      blocking: 2,
      urgency: 1,
      impact: 1,
      omissionCost: 1,
      alignment: 1,
      mentalLoad: 1,
      quickWin: 0
    });
    expect(result.totalScore).toBe(7);
    expect(result.level).toBe("Steady Flow");
  });

  it("returns Low Friction for low-mid score", () => {
    const result = calculatePriority({
      blocking: 1,
      urgency: 1,
      impact: 1,
      omissionCost: 0,
      alignment: 0,
      mentalLoad: 0,
      quickWin: 0
    });
    expect(result.totalScore).toBe(3);
    expect(result.level).toBe("Low Friction");
  });

  it("returns High Velocity for upper-mid score", () => {
    const result = calculatePriority({
      blocking: 2,
      urgency: 2,
      impact: 2,
      omissionCost: 1,
      alignment: 1,
      mentalLoad: 1,
      quickWin: 1
    });
    expect(result.totalScore).toBe(10);
    expect(result.level).toBe("High Velocity");
  });
});
