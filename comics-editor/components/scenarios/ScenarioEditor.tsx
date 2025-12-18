"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import { queries } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FrameList } from "./FrameList";
import { Frame, CharacterWithImages } from "./FrameEditor";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, Copy } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ImageType = "comic" | "superhero" | "both";

interface ScenarioData {
  name: string;
  description: string;
  characterImages: Record<string, ImageType>;
  frames: Frame[];
}

interface ScenarioEditorProps {
  scenarioName?: string; // If provided, editing existing scenario
  isNew?: boolean;
}

export function ScenarioEditor({ scenarioName, isNew }: ScenarioEditorProps) {
  const router = useRouter();
  const createScenario = useMutation(api.comics.createScenario);
  const updateScenario = useMutation(api.comics.updateScenario);

  // Load existing scenario if editing
  const { data: existingScenario, isLoading: loadingScenario } = useQuery({
    ...queries.scenario(scenarioName ?? ""),
    enabled: !!scenarioName && !isNew,
  });

  // Load all characters for frame editor
  const { data: allCharacters } = useQuery(queries.characters());

  const [saving, setSaving] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [cloneName, setCloneName] = useState("");
  const [formData, setFormData] = useState<ScenarioData>({
    name: scenarioName ?? "",
    description: "",
    characterImages: {},
    frames: [],
  });

  // Load existing data when available
  useEffect(() => {
    if (existingScenario?.scenario) {
      setFormData({
        name: existingScenario.scenario.name,
        description: existingScenario.scenario.description,
        characterImages: existingScenario.scenario.characterImages,
        frames: existingScenario.scenario.frames,
      });
    }
  }, [existingScenario]);

  // Build character data for frame editor
  const characterData: CharacterWithImages[] = useMemo(
    () =>
      allCharacters?.map((c) => ({
        key: c.key,
        name: c.metadata?.name ?? c.key,
        comicImageUrl: c.comicImageUrl,
        superheroImageUrl: c.superheroImageUrl,
      })) ?? [],
    [allCharacters]
  );

  // Infer characterImages from all frames
  const inferCharacterImages = (
    frames: Frame[]
  ): Record<string, ImageType> => {
    const result: Record<string, ImageType> = {};

    for (const frame of frames) {
      const imageTypes = frame.characterImageTypes ?? {};
      for (const charKey of frame.characters) {
        const frameType = imageTypes[charKey] ?? "comic";
        const existingType = result[charKey];

        if (!existingType) {
          result[charKey] = frameType;
        } else if (existingType !== frameType && existingType !== "both") {
          // Different type used in different frames -> both
          result[charKey] = "both";
        }
      }
    }

    return result;
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a scenario name");
      return;
    }

    setSaving(true);

    // Infer characterImages from frames
    const characterImages = inferCharacterImages(formData.frames);

    const scenarioToSave = {
      ...formData,
      characterImages,
    };

    try {
      if (isNew || !scenarioName) {
        await createScenario({
          name: formData.name,
          scenario: scenarioToSave,
        });
        toast.success("Scenario created successfully");
        router.push(`/scenarios/${encodeURIComponent(formData.name)}`);
      } else {
        await updateScenario({
          scenarioName,
          scenario: scenarioToSave,
        });
        toast.success("Scenario saved successfully");
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save scenario"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClone = async () => {
    if (!cloneName.trim()) {
      toast.error("Please enter a name for the cloned scenario");
      return;
    }

    setCloning(true);

    // Infer characterImages from frames
    const characterImages = inferCharacterImages(formData.frames);

    const clonedScenario = {
      ...formData,
      name: cloneName,
      characterImages,
    };

    try {
      await createScenario({
        name: cloneName,
        scenario: clonedScenario,
      });
      toast.success(`Scenario cloned as "${cloneName}"`);
      setShowCloneDialog(false);
      setCloneName("");
      router.push(`/scenarios/${encodeURIComponent(cloneName)}`);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to clone scenario"
      );
    } finally {
      setCloning(false);
    }
  };

  const openCloneDialog = () => {
    setCloneName(scenarioName ? `${scenarioName}-copy` : "");
    setShowCloneDialog(true);
  };

  if (loadingScenario && !isNew) {
    return <ScenarioEditorSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/scenarios">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {isNew ? "Create New Scenario" : `Edit: ${scenarioName}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              Define your comic scenario with characters and frames
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && scenarioName && (
            <Button variant="outline" onClick={openCloneDialog}>
              <Copy className="h-4 w-4 mr-2" />
              Clone
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isNew ? "Create" : "Save"}
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="p-6 rounded-lg border bg-card space-y-4">
        <h2 className="text-lg font-semibold">Basic Information</h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Scenario Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., intro-part1"
              disabled={!isNew && !!scenarioName}
            />
            {!isNew && scenarioName && (
              <p className="text-xs text-muted-foreground">
                Name cannot be changed after creation
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description of this scenario"
              rows={2}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
            />
          </div>
        </div>
      </div>

      {/* Frames */}
      <div className="p-6 rounded-lg border bg-card space-y-4">
        <h2 className="text-lg font-semibold">Frames</h2>
        <p className="text-sm text-muted-foreground">
          Add frames and select which characters appear in each. The characters
          you select will automatically be included for AI generation.
        </p>

        <FrameList
          frames={formData.frames}
          allCharacters={characterData}
          onChange={(frames) => setFormData({ ...formData, frames })}
        />
      </div>

      {/* Clone Dialog */}
      <Dialog open={showCloneDialog} onOpenChange={setShowCloneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Scenario</DialogTitle>
            <DialogDescription>
              Create a copy of this scenario with a new name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clone-name">New Scenario Name</Label>
              <Input
                id="clone-name"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                placeholder="e.g., intro-part2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleClone();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCloneDialog(false)}
              disabled={cloning}
            >
              Cancel
            </Button>
            <Button onClick={handleClone} disabled={cloning}>
              {cloning ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Clone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ScenarioEditorSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="h-7 w-48 rounded bg-muted animate-pulse" />
          <div className="h-4 w-64 rounded bg-muted animate-pulse" />
        </div>
      </div>

      {[1, 2, 3].map((i) => (
        <div key={i} className="p-6 rounded-lg border bg-card">
          <div className="h-6 w-32 rounded bg-muted animate-pulse mb-4" />
          <div className="h-24 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}
