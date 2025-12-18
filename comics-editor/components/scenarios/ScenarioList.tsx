"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CdnImage } from "@/components/ui/cdn-image";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { queries } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Plus, FileText, ChevronRight, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScenarioListProps {
  onCreateNew?: () => void;
}

export function ScenarioList({ onCreateNew }: ScenarioListProps) {
  const { data: scenarios, isLoading } = useQuery(queries.scenarios());
  const { data: generatedStrips } = useQuery(queries.generatedStrips());
  const { data: scenarioOrder } = useQuery(queries.scenarioOrder());
  const saveScenarioOrder = useMutation(api.comics.saveScenarioOrder);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Sort scenarios by saved order
  const orderedScenarios = useMemo(() => {
    if (!scenarios) return [];
    if (!scenarioOrder?.order) return scenarios;

    const order = scenarioOrder.order;
    return [...scenarios].sort((a, b) => {
      const aIndex = order.indexOf(a.name);
      const bIndex = order.indexOf(b.name);
      // Items not in the order go to the end
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
      order: newOrder.map((s) => s.name),
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (isLoading) {
    return <ScenarioListSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Scenarios</h2>
        <Button size="sm" onClick={onCreateNew}>
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
          <Button onClick={onCreateNew}>
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
                  href={`/scenarios/${encodeURIComponent(scenario.name)}`}
                  className="flex items-center justify-between p-4 pl-0 flex-1 min-w-0"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Generated strip thumbnail or icon */}
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
  );
}

function ScenarioListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 rounded bg-muted animate-pulse" />
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
  );
}
