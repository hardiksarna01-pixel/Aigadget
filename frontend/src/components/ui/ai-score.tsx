"use client";

import { cn } from "@/lib/utils";

interface AIScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 9) return "from-emerald-400 to-emerald-600";
  if (score >= 8) return "from-blue-400 to-blue-600";
  if (score >= 7) return "from-amber-400 to-amber-600";
  return "from-red-400 to-red-600";
}

function getScoreLabel(score: number): string {
  if (score >= 9) return "Excellent";
  if (score >= 8) return "Great";
  if (score >= 7) return "Good";
  return "Average";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-lg",
};

export function AIScore({ score, size = "md", showLabel = false, className }: AIScoreProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl bg-gradient-to-br font-bold text-white shadow-lg",
          getScoreColor(score),
          sizeClasses[size]
        )}
      >
        {score.toFixed(1)}
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-muted-foreground">AI Score</span>
          <span className="text-sm font-semibold">{getScoreLabel(score)}</span>
        </div>
      )}
    </div>
  );
}
