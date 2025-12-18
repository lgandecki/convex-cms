"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useStory } from "@/lib/storyContext";
import { StoryGenerationPanel } from "@/components/generation/StoryGenerationPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

function StoryGenerateContent() {
  const { storySlug, story } = useStory();
  const searchParams = useSearchParams();
  const preselectedScenario = searchParams.get("scenario");

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/stories/${storySlug}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-1">Generate Comic Strip</h1>
            <p className="text-muted-foreground">
              {story?.name} - Select a scenario and generate a comic strip using
              AI.
            </p>
          </div>
        </div>

        <StoryGenerationPanel
          storySlug={storySlug}
          preselectedScenario={preselectedScenario ?? undefined}
        />
      </div>
    </div>
  );
}

export default function StoryGeneratePage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <StoryGenerateContent />
    </Suspense>
  );
}
