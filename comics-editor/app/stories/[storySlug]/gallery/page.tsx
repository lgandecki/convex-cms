"use client";

import Link from "next/link";
import { useStory } from "@/lib/storyContext";
import { StoryGalleryGrid } from "@/components/gallery/StoryGalleryGrid";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function StoryGalleryPage() {
  const { storySlug, story } = useStory();

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/stories/${storySlug}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-1">Gallery</h1>
            <p className="text-muted-foreground">
              {story?.name} - View your generated comic strips.
            </p>
          </div>
        </div>

        <StoryGalleryGrid storySlug={storySlug} />
      </div>
    </div>
  );
}
