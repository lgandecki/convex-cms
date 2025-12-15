"use client";

import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

interface GenerationProgressProps {
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number;
  progressMessage?: string;
  error?: string;
}

export function GenerationProgress({
  status,
  progress,
  progressMessage,
  error,
}: GenerationProgressProps) {
  return (
    <div className="space-y-4">
      {/* Status indicator */}
      <div className="flex items-center gap-3">
        {status === "pending" && (
          <>
            <Clock className="h-5 w-5 text-muted-foreground animate-pulse" />
            <span className="text-muted-foreground">Queued</span>
          </>
        )}
        {status === "processing" && (
          <>
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            <span className="text-primary">Processing</span>
          </>
        )}
        {status === "completed" && (
          <>
            <CheckCircle2 className="h-5 w-5 text-success" />
            <span className="text-success">Complete</span>
          </>
        )}
        {status === "failed" && (
          <>
            <XCircle className="h-5 w-5 text-destructive" />
            <span className="text-destructive">Failed</span>
          </>
        )}
      </div>

      {/* Progress bar */}
      {(status === "pending" || status === "processing") && (
        <div className="space-y-2">
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500 ease-out",
                status === "pending"
                  ? "bg-muted-foreground/50 animate-pulse"
                  : "bg-primary"
              )}
              style={{ width: `${progress ?? 0}%` }}
            />
          </div>
          {progressMessage && (
            <p className="text-sm text-muted-foreground">{progressMessage}</p>
          )}
        </div>
      )}

      {/* Error message */}
      {status === "failed" && error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
