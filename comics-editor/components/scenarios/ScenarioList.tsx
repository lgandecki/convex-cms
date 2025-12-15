"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { queries } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Plus, FileText, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScenarioListProps {
  onCreateNew?: () => void;
}

export function ScenarioList({ onCreateNew }: ScenarioListProps) {
  const { data: scenarios, isLoading } = useQuery(queries.scenarios());
  const { data: generatedStrips } = useQuery(queries.generatedStrips());

  // Create a map of scenario name to its first generated strip
  const stripsByScenario = generatedStrips?.reduce(
    (acc, strip) => {
      if (!acc[strip.scenarioName]) {
        acc[strip.scenarioName] = strip;
      }
      return acc;
    },
    {} as Record<string, (typeof generatedStrips)[number]>
  );

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

      {!scenarios || scenarios.length === 0 ? (
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
          {scenarios.map((scenario) => {
            const generatedStrip = stripsByScenario?.[scenario.name];
            return (
              <Link
                key={scenario.name}
                href={`/scenarios/${encodeURIComponent(scenario.name)}`}
                className={cn(
                  "group flex items-center justify-between p-4 rounded-lg border bg-card",
                  "hover:border-primary/50 hover:shadow-glow-sm transition-all"
                )}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Generated strip thumbnail or icon */}
                  {generatedStrip ? (
                    <div className="relative w-16 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <Image
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
