"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useQuery as useTanstackQuery } from "@tanstack/react-query";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { queries } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { CdnImage } from "@/components/ui/cdn-image";
import { toast } from "sonner";
import { getVersionUrl } from "@/lib/assetUrl";

export default function NewStoryPage() {
  const router = useRouter();
  const startStoryGeneration = useMutation(api.comicGeneration.startStoryGeneration);

  const [description, setDescription] = useState("");
  const [generationId, setGenerationId] = useState<Id<"comicSubmissions"> | null>(null);

  // Load characters for display
  const { data: characters } = useTanstackQuery(queries.characters());

  // Poll for generation status
  const submission = useQuery(
    api.comicSubmissions.get,
    generationId ? { id: generationId } : "skip"
  );

  // Handle generation completion - redirect to first scenario
  useEffect(() => {
    if (submission?.status === "completed" && submission.storySlug) {
      toast.success(`Story "${submission.storyName}" created! Strips are generating in the background.`);
      // Redirect to first scenario if available, otherwise dashboard
      if (submission.firstScenarioName) {
        router.push(`/stories/${submission.storySlug}/scenarios/${encodeURIComponent(submission.firstScenarioName)}`);
      } else {
        router.push(`/stories/${submission.storySlug}/scenarios`);
      }
    } else if (submission?.status === "failed") {
      toast.error(submission.error || "Story generation failed");
      setGenerationId(null);
    }
  }, [submission, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error("Please enter a story description");
      return;
    }

    if (description.trim().length < 20) {
      toast.error("Please provide a more detailed description (at least 20 characters)");
      return;
    }

    try {
      const id = await startStoryGeneration({
        description: description.trim(),
      });
      setGenerationId(id);
    } catch (error) {
      console.error("Failed to start story generation:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to start generation"
      );
    }
  };

  const isGenerating = generationId !== null && submission?.status !== "failed";

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild disabled={isGenerating}>
            <Link href="/stories">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create New Story</h1>
            <p className="text-muted-foreground">
              Describe your story idea and AI will generate scenarios for you
            </p>
          </div>
        </div>

        {/* Characters Display */}
        {characters && characters.length > 0 && (
          <div className="space-y-2 px-0 md:px-12">
            <h2 className="text-sm font-medium text-muted-foreground">Starring</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {characters.map((character) => {
                const comicUrl = character.comicImage
                  ? getVersionUrl({ versionId: character.comicImage.versionId, basename: character.comicImage.basename })
                  : null;
                const superheroUrl = character.superheroImage
                  ? getVersionUrl({ versionId: character.superheroImage.versionId, basename: character.superheroImage.basename })
                  : null;

                return (
                  <div key={character.key} className="flex flex-col items-center gap-1">
                    <div
                      className="group relative aspect-square w-full rounded-lg overflow-hidden bg-muted border border-border/50 hover:border-primary/50 transition-colors"
                    >
                      {comicUrl ? (
                        <CdnImage
                          src={comicUrl}
                          alt={character.metadata?.name ?? character.key}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 20vw, 120px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl font-bold text-muted-foreground/30">
                          {(character.metadata?.name ?? character.key).charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Superhero overlay on hover */}
                      {superheroUrl && (
                        <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <CdnImage
                            src={superheroUrl}
                            alt={`${character.metadata?.name ?? character.key} superhero`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 20vw, 120px"
                          />
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate w-full text-center">
                      {character.metadata?.name ?? character.key}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Story Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="Describe your story idea in detail. What's the plot? Which characters should be involved? What's the tone - funny, dramatic, action-packed? The more detail you provide, the better the generated scenarios will be."
              rows={8}
              disabled={isGenerating}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              AI will generate a story name and 3-5 scenarios based on your description
            </p>
          </div>

          {/* Generation Progress */}
          {isGenerating && submission && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium">
                  {submission.progressMessage || "Generating..."}
                </span>
              </div>
              {typeof submission.progress === "number" && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${submission.progress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isGenerating || !description.trim()}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Story
                </>
              )}
            </Button>
            <Button type="button" variant="outline" asChild disabled={isGenerating}>
              <Link href="/stories">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
