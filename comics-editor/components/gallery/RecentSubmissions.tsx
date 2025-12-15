"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function RecentSubmissions() {
  const submissions = useQuery(api.comicSubmissions.listRecent, { limit: 10 });

  if (!submissions || submissions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Recent Generations</h2>
      <div className="space-y-2">
        {submissions.map((submission) => (
          <div
            key={submission._id}
            className="flex items-center gap-4 p-4 rounded-lg border bg-card"
          >
            {/* Status icon */}
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                submission.status === "pending" && "bg-muted",
                submission.status === "processing" && "bg-primary/10",
                submission.status === "completed" && "bg-success/10",
                submission.status === "failed" && "bg-destructive/10"
              )}
            >
              {submission.status === "pending" && (
                <Clock className="h-5 w-5 text-muted-foreground" />
              )}
              {submission.status === "processing" && (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              )}
              {submission.status === "completed" && (
                <CheckCircle2 className="h-5 w-5 text-success" />
              )}
              {submission.status === "failed" && (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {submission.scenarioPath
                  .replace("comics/scenarios/", "")
                  .replace(".json", "")}
              </p>
              <p className="text-sm text-muted-foreground">
                {submission.status === "processing" &&
                  `${submission.progress ?? 0}% - ${submission.progressMessage ?? "Processing..."}`}
                {submission.status === "failed" && submission.error}
                {(submission.status === "pending" ||
                  submission.status === "completed") &&
                  formatDistanceToNow(submission.createdAt, {
                    addSuffix: true,
                  })}
              </p>
            </div>

            {/* Thumbnail */}
            {submission.status === "completed" && submission.resultUrl && (
              <div className="w-12 h-20 rounded overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={submission.resultUrl}
                  alt="Result"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
