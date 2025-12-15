"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useQuery as useTanstackQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import { queries } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GenerationProgress } from "./GenerationProgress";
import { GenerationResult } from "./GenerationResult";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

interface GenerationPanelProps {
  preselectedScenario?: string;
}

export function GenerationPanel({ preselectedScenario }: GenerationPanelProps) {
  const { data: scenarios, isLoading: loadingScenarios } = useTanstackQuery(
    queries.scenarios()
  );

  const startGeneration = useMutation(api.comicGeneration.startGeneration);

  const [selectedScenario, setSelectedScenario] = useState<string>(
    preselectedScenario ?? ""
  );

  // Update selection when preselectedScenario changes or scenarios load
  useEffect(() => {
    if (preselectedScenario && scenarios?.some((s) => s.name === preselectedScenario)) {
      setSelectedScenario(preselectedScenario);
    }
  }, [preselectedScenario, scenarios]);
  const [submissionId, setSubmissionId] = useState<Id<"comicSubmissions"> | null>(
    null
  );
  const [starting, setStarting] = useState(false);

  // Watch submission status
  const submission = useQuery(
    api.comicSubmissions.get,
    submissionId ? { id: submissionId } : "skip"
  );

  const handleGenerate = async () => {
    if (!selectedScenario) {
      toast.error("Please select a scenario");
      return;
    }

    setStarting(true);

    try {
      const id = await startGeneration({
        scenarioPath: `comics/scenarios/${selectedScenario}.json`,
      });
      setSubmissionId(id);
      toast.success("Generation started!");
    } catch (error) {
      toast.error("Failed to start generation");
      console.error(error);
    } finally {
      setStarting(false);
    }
  };

  const handleNewGeneration = () => {
    setSubmissionId(null);
  };

  const selectedScenarioData = scenarios?.find(
    (s) => s.name === selectedScenario
  );

  return (
    <div className="space-y-6">
      {/* Scenario Selection */}
      {!submissionId && (
        <div className="p-6 rounded-lg border bg-card space-y-4">
          <h2 className="text-lg font-semibold">Select Scenario</h2>

          {loadingScenarios ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading scenarios...
            </div>
          ) : !scenarios || scenarios.length === 0 ? (
            <div className="p-4 rounded-lg border border-dashed text-center text-muted-foreground">
              <p>No scenarios found. Create a scenario first.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="scenario">Scenario</Label>
                <select
                  id="scenario"
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select a scenario...</option>
                  {scenarios.map((scenario) => (
                    <option key={scenario.name} value={scenario.name}>
                      {scenario.name}
                      {scenario.scenario?.frames &&
                        ` (${scenario.scenario.frames.length} frames)`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scenario preview */}
              {selectedScenarioData?.scenario && (
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <p className="text-sm font-medium">
                    {selectedScenarioData.scenario.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(
                      selectedScenarioData.scenario.characterImages
                    ).map(([char, type]) => (
                      <span
                        key={char}
                        className="text-xs px-2 py-1 rounded bg-primary/10 text-primary"
                      >
                        {char} ({type})
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedScenarioData.scenario.frames.length} frames
                  </p>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={!selectedScenario || starting}
                size="lg"
                className="w-full"
              >
                {starting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate Comic Strip
              </Button>
            </>
          )}
        </div>
      )}

      {/* Generation Status */}
      {submissionId && submission && (
        <div className="p-6 rounded-lg border bg-card space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Generating: {selectedScenario}
            </h2>
            {(submission.status === "completed" ||
              submission.status === "failed") && (
              <Button variant="outline" size="sm" onClick={handleNewGeneration}>
                New Generation
              </Button>
            )}
          </div>

          <GenerationProgress
            status={submission.status}
            progress={submission.progress}
            progressMessage={submission.progressMessage}
            error={submission.error}
          />

          {/* Result */}
          {submission.status === "completed" && submission.resultUrl && (
            <GenerationResult
              imageUrl={submission.resultUrl}
              scenarioName={selectedScenario}
            />
          )}
        </div>
      )}
    </div>
  );
}
