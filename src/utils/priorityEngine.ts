export type FactorValue = 0 | 1 | 2;

export type PriorityFactors = {
  blocking: FactorValue;
  urgency: FactorValue;
  impact: FactorValue;
  omissionCost: FactorValue;
  alignment: FactorValue;
  mentalLoad: FactorValue;
  quickWin: FactorValue;
};

export type PriorityLevel =
  | "Critical"
  | "High Velocity"
  | "Steady Flow"
  | "Low Friction"
  | "Backlog";

export type PriorityResult = {
  totalScore: number;
  level: PriorityLevel;
};

const clampScore = (score: number) => Math.max(0, Math.min(14, score));

export const getPriorityLevel = (score: number): PriorityLevel => {
  if (score >= 12) return "Critical";
  if (score >= 9) return "High Velocity";
  if (score >= 6) return "Steady Flow";
  if (score >= 3) return "Low Friction";
  return "Backlog";
};

export const calculatePriority = (factors: PriorityFactors): PriorityResult => {
  const totalScore = clampScore(
    factors.blocking +
      factors.urgency +
      factors.impact +
      factors.omissionCost +
      factors.alignment +
      factors.mentalLoad +
      factors.quickWin
  );

  return {
    totalScore,
    level: getPriorityLevel(totalScore)
  };
};
