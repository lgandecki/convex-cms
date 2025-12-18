"use client";

import { useQuery } from "@tanstack/react-query";
import { queries } from "@/lib/queries";
import { StoryCard } from "@/components/stories/StoryCard";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";
import Link from "next/link";

export default function StoriesPage() {
  const { data: stories, isLoading } = useQuery(queries.stories());

  if (isLoading) {
    return <StoriesPageSkeleton />;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Stories</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your comic stories
            </p>
          </div>
          <Button asChild className="w-full md:w-auto">
            <Link href="/stories/new">
              <Plus className="h-4 w-4 mr-2" />
              New Story
            </Link>
          </Button>
        </div>

        {!stories || stories.length === 0 ? (
          <div className="p-12 rounded-lg border border-dashed border-border bg-card/50 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              No stories yet. Create your first story to get started.
            </p>
            <Button asChild>
              <Link href="/stories/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Story
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {stories.map((story) => (
              <StoryCard
                key={story.slug}
                slug={story.slug}
                name={story.name}
                description={story.description}
                scenarioCount={story.scenarioCount}
                thumbnailVersionId={story.thumbnailVersionId}
                thumbnailBasename={story.thumbnailBasename}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StoriesPageSkeleton() {
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="h-8 md:h-9 w-32 rounded bg-muted animate-pulse" />
            <div className="h-5 w-64 rounded bg-muted animate-pulse mt-2" />
          </div>
          <div className="h-10 w-full md:w-32 rounded bg-muted animate-pulse" />
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-lg border bg-card"
            >
              <div className="w-20 h-28 rounded-lg bg-muted animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-6 w-48 rounded bg-muted animate-pulse" />
                <div className="h-4 w-full max-w-md rounded bg-muted animate-pulse" />
                <div className="h-3 w-24 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
