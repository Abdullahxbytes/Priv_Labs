"use client";

import { useAnimatedNumber } from "@/components/report/animated-number";

export function ScoreGauge({ score, tone }: { score: number; tone: string }) {
  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
  const animatedScore = useAnimatedNumber(boundedScore, 950);
  const circumference = 2 * Math.PI * 46;
  const offset = circumference * (1 - animatedScore / 100);

  return (
    <div
      className={`score-gauge ${tone}`}
      role="img"
      aria-label={`Privacy score ${boundedScore} out of 100. Higher is better.`}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="score-gauge-track" cx="60" cy="60" r="46" />
        <circle
          className="score-gauge-value"
          cx="60"
          cy="60"
          r="46"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-gauge-label">
        <strong>{animatedScore}</strong>
        <span>/100</span>
        <small>Privacy score</small>
      </div>
      <p>Higher is better</p>
    </div>
  );
}
