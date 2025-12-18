"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CdnImage } from "@/components/ui/cdn-image";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { queries } from "@/lib/queries";
import { useStory } from "@/lib/storyContext";
import { Button } from "@/components/ui/button";
import {
  Plus,
  FileText,
  ChevronRight,
  GripVertical,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function StoryScenariosPage() {
  const router = useRouter();
  const { storySlug, story } = useStory();
  const { data: scenarios, isLoading } = useQuery(
    queries.storyScenarios(storySlug)
  );
  const { data: generatedStrips } = useQuery(queries.storyStrips(storySlug));
  const { data: scenarioOrder } = useQuery(
    queries.storyScenarioOrder(storySlug)
  );

  const createScenario = useMutation(api.comics.createStoryScenario);
  const saveScenarioOrder = useMutation(api.comics.saveStoryScenarioOrder);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Sort scenarios by saved order
  const orderedScenarios = useMemo(() => {
    if (!scenarios) return [];
    if (!scenarioOrder?.order) return scenarios;

    const order = scenarioOrder.order;
    return [...scenarios].sort((a, b) => {
      const aIndex = order.indexOf(a.name);
      const bIndex = order.indexOf(b.name);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [scenarios, scenarioOrder]);

  // Create a map of scenario name to its most recent generated strip
  const stripsByScenario = generatedStrips?.reduce(
    (acc, strip) => {
      acc[strip.scenarioName] = strip;
      return acc;
    },
    {} as Record<string, (typeof generatedStrips)[number]>
  );

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...orderedScenarios];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, removed);

    // Save the new order
    await saveScenarioOrder({
      storySlug,
      order: newOrder.map((s) => s.name),
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleCreateNew = async () => {
    if (!newName.trim()) {
      toast.error("Please enter a scenario name");
      return;
    }

    setIsCreating(true);
    try {
      await createScenario({
        storySlug,
        name: newName.trim(),
        scenario: {
          name: newName.trim(),
          description: "",
          characterImages: {},
          frames: [],
        },
      });
      toast.success("Scenario created!");
      setShowNewDialog(false);
      setNewName("");
      router.push(
        `/stories/${storySlug}/scenarios/${encodeURIComponent(newName.trim())}`
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create scenario"
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <ScenarioListSkeleton storySlug={storySlug} storyName={story?.name} />;
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/stories/${storySlug}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Scenarios</h1>
            <p className="text-sm text-muted-foreground">{story?.name}</p>
          </div>
          <Button size="sm" onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Scenario
          </Button>
        </div>

        {!orderedScenarios || orderedScenarios.length === 0 ? (
          <div className="p-12 rounded-lg border border-dashed border-border bg-card/50 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              No scenarios yet. Create your first one to get started.
            </p>
            <Button onClick={() => setShowNewDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Scenario
            </Button>
          </div>
        ) : (
          <div className="grid gap-2">
            {orderedScenarios.map((scenario, index) => {
              const generatedStrip = stripsByScenario?.[scenario.name];
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;

              return (
                <div
                  key={scenario.name}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "group flex items-center rounded-lg border bg-card transition-all",
                    "hover:border-primary/50 hover:shadow-glow-sm",
                    isDragging && "opacity-50",
                    isDragOver && "border-primary border-2"
                  )}
                >
                  {/* Drag handle */}
                  <div className="flex items-center justify-center px-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                    <GripVertical className="h-5 w-5" />
                  </div>

                  <Link
                    href={`/stories/${storySlug}/scenarios/${encodeURIComponent(scenario.name)}`}
                    className="flex items-center justify-between p-4 pl-0 flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {generatedStrip ? (
                        <div className="relative w-16 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <CdnImage
                            src={generatedStrip.url}
                            alt={`${scenario.name} preview`}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium">{scenario.name}</h3>
                        {scenario.scenario && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {scenario.scenario.description}
                          </p>
                        )}
                        {scenario.scenario?.frames && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {scenario.scenario.frames.length} frames
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Scenario Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Scenario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scenarioName">Scenario Name</Label>
              <Input
                id="scenarioName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., 01-intro"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateNew();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewDialog(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateNew} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ScenarioListSkeleton({
  storySlug,
  storyName,
}: {
  storySlug: string;
  storyName?: string;
}) {
  return (
    <div className="p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/stories/${storySlug}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="h-8 w-32 rounded bg-muted animate-pulse" />
            <div className="h-4 w-48 rounded bg-muted animate-pulse mt-1" />
          </div>
          <div className="h-9 w-32 rounded bg-muted animate-pulse" />
        </div>
        <div className="grid gap-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-lg border bg-card"
            >
              <div className="w-16 h-24 rounded-lg bg-muted animate-pulse flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                <div className="h-3 w-full max-w-md rounded bg-muted animate-pulse" />
                <div className="h-3 w-20 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
