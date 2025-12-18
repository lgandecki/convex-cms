"use client";

import Link from "next/link";
import { CdnImage } from "@/components/ui/cdn-image";
import { BookOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getVersionUrl } from "@/lib/assetUrl";

interface StoryCardProps {
  slug: string;
  name: string;
  description: string;
  scenarioCount: number;
  thumbnailVersionId: string | null;
  thumbnailBasename: string | null;
}

export function StoryCard({
  slug,
  name,
  description,
  scenarioCount,
  thumbnailVersionId,
  thumbnailBasename,
}: StoryCardProps) {
  const thumbnailUrl = thumbnailVersionId && thumbnailBasename
    ? getVersionUrl({ versionId: thumbnailVersionId, basename: thumbnailBasename })
    : null;

  return (
    <Link
      href={`/stories/${slug}/scenarios`}
      className={cn(
        "group flex items-center gap-4 p-4 rounded-lg border bg-card",
        "hover:border-primary/50 hover:shadow-glow-sm transition-all"
      )}
    >
      {/* Thumbnail */}
      {thumbnailUrl ? (
        <div className="relative w-20 h-28 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          <CdnImage
            src={thumbnailUrl}
            alt={`${name} preview`}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>
      ) : (
        <div className="w-20 h-28 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-lg">{name}</h3>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {description}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          {scenarioCount} {scenarioCount === 1 ? "scenario" : "scenarios"}
        </p>
      </div>

      {/* Arrow */}
      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
    </Link>
  );
}
