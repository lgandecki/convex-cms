"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useQuery as useTanstackQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { queries } from "@/lib/queries";
import { getVersionUrl } from "@/lib/assetUrl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FrameList } from "./FrameList";
import { Frame, CharacterWithImages, EditableText } from "./FrameEditor";
import { GenerationProgress } from "../generation/GenerationProgress";
import { toast } from "sonner";
import {
  Loader2,
  Copy,
  Sparkles,
  ImageIcon,
  Check,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CdnImage } from "@/components/ui/cdn-image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type ImageType = "comic" | "superhero" | "both";

interface ScenarioData {
  name: string;
  description: string;
  characterImages: Record<string, ImageType>;
  frames: Frame[];
}

interface StoryScenarioEditorProps {
  storySlug: string;
  scenarioName?: string;
  isNew?: boolean;
}

export function StoryScenarioEditor({
  storySlug,
  scenarioName,
  isNew,
}: StoryScenarioEditorProps) {
  const router = useRouter();
  const createScenario = useMutation(api.comics.createStoryScenario);
  const updateScenario = useMutation(api.comics.updateStoryScenario);
  const startGeneration = useMutation(api.comicGeneration.startGeneration);
  const generateUploadUrl = useMutation(api.generateUploadUrl.generateUploadUrl);
  const commitUpload = useMutation(api.generateUploadUrl.commitUpload);
  const ensureStripFolder = useMutation(api.comics.ensureStoryStripFolder);
  const removeSubmission = useMutation(api.comicSubmissions.remove);

  // Load existing scenario if editing
  const { data: existingScenario, isLoading: loadingScenario } = useTanstackQuery({
    ...queries.storyScenario(storySlug, scenarioName ?? ""),
    enabled: !!scenarioName && !isNew,
  });

  // Load story strips for this scenario
  const { data: existingStrips } = useTanstackQuery({
    ...queries.storyStrips(storySlug, scenarioName),
    enabled: !!scenarioName && !isNew,
  });

  // Load ALL story strips for prefetching adjacent scenarios
  const { data: allStoryStrips } = useTanstackQuery(queries.storyStrips(storySlug));

  // Load all characters for frame editor
  const { data: allCharacters } = useTanstackQuery(queries.characters());

  // Load all scenarios for navigation
  const { data: allScenarios } = useTanstackQuery(queries.storyScenarios(storySlug));
  const { data: scenarioOrder } = useTanstackQuery(queries.storyScenarioOrder(storySlug));

  // Calculate ordered scenarios for prev/next navigation
  const orderedScenarios = useMemo(() => {
    if (!allScenarios) return [];
    if (!scenarioOrder?.order) return allScenarios;

    const order = scenarioOrder.order;
    return [...allScenarios].sort((a, b) => {
      const aIndex = order.indexOf(a.name);
      const bIndex = order.indexOf(b.name);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [allScenarios, scenarioOrder]);

  // Find current index and prev/next scenarios
  const currentIndex = orderedScenarios.findIndex((s) => s.name === scenarioName);
  const prevScenario = currentIndex > 0 ? orderedScenarios[currentIndex - 1] : null;
  const nextScenario = currentIndex < orderedScenarios.length - 1 ? orderedScenarios[currentIndex + 1] : null;

  // Find strips for prev/next scenarios (for prefetching)
  const prevScenarioStrip = useMemo(() => {
    if (!prevScenario || !allStoryStrips) return null;
    return allStoryStrips.find((s) => s.scenarioName === prevScenario.name) ?? null;
  }, [prevScenario, allStoryStrips]);

  const nextScenarioStrip = useMemo(() => {
    if (!nextScenario || !allStoryStrips) return null;
    return allStoryStrips.find((s) => s.scenarioName === nextScenario.name) ?? null;
  }, [nextScenario, allStoryStrips]);

  // Track when current strip image has loaded (for prefetching)
  const [stripImageLoaded, setStripImageLoaded] = useState(false);

  // Reset stripImageLoaded when scenario changes
  useEffect(() => {
    setStripImageLoaded(false);
  }, [scenarioName]);

  const [saving, setSaving] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [cloneName, setCloneName] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [localSubmissionId, setLocalSubmissionId] = useState<Id<"comicSubmissions"> | null>(null);
  const [savingStrip, setSavingStrip] = useState(false);
  const [formData, setFormData] = useState<ScenarioData>({
    name: scenarioName ?? "",
    description: "",
    characterImages: {},
    frames: [],
  });

  // Build scenario path for querying active submissions
  const scenarioPath = scenarioName
    ? `comics/stories/${storySlug}/scenarios/${scenarioName}.json`
    : null;

  // Query for any active submission for this scenario (persists across navigation)
  const activeSubmission = useQuery(
    api.comicSubmissions.getActiveByScenario,
    scenarioPath ? { scenarioPath } : "skip"
  );

  // Watch local submission status (for isFirstGeneration tracking)
  const localSubmission = useQuery(
    api.comicSubmissions.get,
    localSubmissionId ? { id: localSubmissionId } : "skip"
  );

  // Use activeSubmission for display, but track isFirstGeneration via localSubmissionId
  const submission = activeSubmission ?? localSubmission;

  // Get latest strip for preview
  const latestStrip = existingStrips?.[0];

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

  // Determine if this should be auto-saved (first strip for this scenario)
  // Works even after navigation because it checks if strips exist
  const shouldAutoSave = !latestStrip && !isNew;

  // Track which submission we've already auto-saved to prevent duplicate saves
  const autoSavedSubmissionRef = useRef<string | null>(null);

  // Auto-save first generated strip
  useEffect(() => {
    const submissionId = submission?._id;
    if (
      shouldAutoSave &&
      submission?.status === "completed" &&
      submission?.resultUrl &&
      !savingStrip &&
      submissionId &&
      autoSavedSubmissionRef.current !== submissionId
    ) {
      // Mark this submission as being auto-saved
      autoSavedSubmissionRef.current = submissionId;
      // Automatically save the first strip
      handleKeepStrip();
    }
  }, [shouldAutoSave, submission?.status, submission?.resultUrl, submission?._id, savingStrip]);

  // Build character data for frame editor with CDN-aware URLs
  const characterData: CharacterWithImages[] = useMemo(
    () =>
      allCharacters?.map((c) => ({
        key: c.key,
        name: c.metadata?.name ?? c.key,
        comicImageUrl: c.comicImage
          ? getVersionUrl({ versionId: c.comicImage.versionId, basename: c.comicImage.basename })
          : null,
        superheroImageUrl: c.superheroImage
          ? getVersionUrl({ versionId: c.superheroImage.versionId, basename: c.superheroImage.basename })
          : null,
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

    const characterImages = inferCharacterImages(formData.frames);

    const scenarioToSave = {
      ...formData,
      characterImages,
    };

    try {
      if (isNew || !scenarioName) {
        await createScenario({
          storySlug,
          name: formData.name,
          scenario: scenarioToSave,
        });
        toast.success("Scenario created successfully");
        router.push(
          `/stories/${storySlug}/scenarios/${encodeURIComponent(formData.name)}`
        );
      } else {
        await updateScenario({
          storySlug,
          scenarioName,
          scenario: scenarioToSave,
        });
        toast.success("Scenario saved successfully");
      }
      return true;
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save scenario"
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndRegenerate = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a scenario name");
      return;
    }

    // First save
    const saved = await handleSave();
    if (!saved) return;

    // Then start generation
    const scenarioPath = `comics/stories/${storySlug}/scenarios/${formData.name}.json`;
    const isFirstStrip = !latestStrip;

    try {
      const id = await startGeneration({
        scenarioPath,
        storySlug,
      });
      setLocalSubmissionId(id);
      toast.success(isFirstStrip ? "Generating first strip..." : "Generation started!");
    } catch (error) {
      toast.error("Failed to start generation");
      console.error(error);
    }
  };

  const handleKeepStrip = async () => {
    if (!submission?.resultUrl || !scenarioName) return;

    setSavingStrip(true);
    try {
      // 1. Fetch image from resultUrl
      const response = await fetch(submission.resultUrl);
      const blob = await response.blob();

      // 2. Ensure the strip folder exists and get the correct basename
      const { basename } = await ensureStripFolder({
        storySlug,
        scenarioName,
      });

      // 3. Get upload URL from asset manager
      const uploadUrl = await generateUploadUrl({});

      // 4. Upload the blob
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: blob,
        headers: { "Content-Type": blob.type },
      });
      const { storageId } = await uploadResponse.json();

      // 5. Commit to asset manager
      await commitUpload({
        folderPath: `comics/stories/${storySlug}/strips/${scenarioName}`,
        basename,
        storageId,
        publish: true,
        label: `Generated at ${new Date().toISOString()}`,
      });

      toast.success(shouldAutoSave ? "First strip saved!" : "Comic strip saved!");

      // Remove the submission so it doesn't keep showing
      if (submission?._id) {
        try {
          await removeSubmission({ id: submission._id });
        } catch (e) {
          // Silently fail - not critical
        }
      }
      setLocalSubmissionId(null);
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save comic strip");
    } finally {
      setSavingStrip(false);
    }
  };

  const handleRetry = () => {
    // Start a new generation with the same scenario
    handleSaveAndRegenerate();
  };

  const handleReject = async () => {
    // Clear local state and remove from active submissions
    if (submission?._id) {
      try {
        await removeSubmission({ id: submission._id });
      } catch (e) {
        // Silently fail - the submission may already be gone
      }
    }
    setLocalSubmissionId(null);
  };

  const handleClone = async () => {
    if (!cloneName.trim()) {
      toast.error("Please enter a name for the cloned scenario");
      return;
    }

    setCloning(true);

    const characterImages = inferCharacterImages(formData.frames);

    const clonedScenario = {
      ...formData,
      name: cloneName,
      characterImages,
    };

    try {
      await createScenario({
        storySlug,
        name: cloneName,
        scenario: clonedScenario,
      });
      toast.success(`Scenario cloned as "${cloneName}"`);
      setShowCloneDialog(false);
      setCloneName("");
      router.push(
        `/stories/${storySlug}/scenarios/${encodeURIComponent(cloneName)}`
      );
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

  // Derive state from submission (which is either activeSubmission or localSubmission)
  const isGenerating =
    submission !== null &&
    submission !== undefined &&
    (submission.status === "pending" || submission.status === "processing");
  const hasResult = submission?.status === "completed" && submission?.resultUrl;

  if (loadingScenario && !isNew) {
    return <StoryScenarioEditorSkeleton storySlug={storySlug} />;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">
            {isNew ? "Create New Scenario" : scenarioName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isNew
              ? "Define your comic scenario with characters and frames"
              : `${currentIndex + 1} of ${orderedScenarios.length} scenarios`
            }
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Prev/Next Navigation */}
          {!isNew && orderedScenarios.length > 1 && (
            <div className="flex items-center gap-1 mr-2">
              <Button
                variant="outline"
                size="icon"
                disabled={!prevScenario}
                asChild={!!prevScenario}
              >
                {prevScenario ? (
                  <Link href={`/stories/${storySlug}/scenarios/${encodeURIComponent(prevScenario.name)}`} prefetch={true}>
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                ) : (
                  <span><ChevronLeft className="h-4 w-4" /></span>
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={!nextScenario}
                asChild={!!nextScenario}
              >
                {nextScenario ? (
                  <Link href={`/stories/${storySlug}/scenarios/${encodeURIComponent(nextScenario.name)}`} prefetch={true}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span><ChevronRight className="h-4 w-4" /></span>
                )}
              </Button>
            </div>
          )}
          {/* Clone button - hidden on mobile */}
          {!isNew && scenarioName && (
            <Button variant="outline" onClick={openCloneDialog} className="hidden md:flex">
              <Copy className="h-4 w-4 mr-2" />
              Clone
            </Button>
          )}
          {/* Save & Regenerate (or Create for new) */}
          {isNew ? (
            <Button onClick={handleSave} disabled={saving || isGenerating}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Create
            </Button>
          ) : (
            <Button
              onClick={handleSaveAndRegenerate}
              disabled={saving || isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Save & Regenerate
            </Button>
          )}
        </div>
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-6">
        {/* Strip Preview - shows after description on mobile, left column on desktop */}
        <div className="p-3 md:p-6 rounded-lg border bg-card space-y-4 order-2 lg:order-1 lg:row-span-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Strip Preview
          </h2>

          {/* Generation in progress */}
          {isGenerating && submission && (
            <div className="space-y-4">
              <GenerationProgress
                status={submission.status}
                progress={submission.progress}
                progressMessage={submission.progressMessage}
                error={submission.error}
              />
            </div>
          )}

          {/* Generation failed */}
          {submission?.status === "failed" && (
            <div className="space-y-4">
              <GenerationProgress
                status="failed"
                error={submission.error}
              />
              <Button variant="outline" onClick={handleReject}>
                Dismiss
              </Button>
            </div>
          )}

          {/* Generation result with Keep/Reject/Retry (only for regeneration, not first) */}
          {hasResult && (
            <div className="space-y-4">
              <button
                onClick={() => setShowPreviewModal(true)}
                className="relative rounded-lg overflow-hidden border bg-muted aspect-[9/16] w-full cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              >
                <CdnImage
                  src={submission.resultUrl!}
                  alt={`Generated comic: ${scenarioName}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </button>
              {shouldAutoSave ? (
                // First generation - auto-saving
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving first strip...</span>
                </div>
              ) : (
                // Regeneration - show Keep and Regenerate
                <div className="flex gap-2">
                  <Button onClick={handleKeepStrip} disabled={savingStrip}>
                    {savingStrip ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    {savingStrip ? "Saving..." : "Keep"}
                  </Button>
                  <Button onClick={handleRetry} variant="outline" disabled={savingStrip}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Show latest saved strip when not generating */}
          {!isGenerating && !hasResult && latestStrip && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Latest version:</p>
              <button
                onClick={() => setShowPreviewModal(true)}
                className="relative rounded-lg overflow-hidden border bg-muted aspect-[9/16] w-full cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              >
                <CdnImage
                  src={getVersionUrl({ versionId: latestStrip.versionId, basename: latestStrip.basename })}
                  alt={`Comic strip: ${scenarioName}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onLoad={() => setStripImageLoaded(true)}
                />
              </button>
              <p className="text-xs text-muted-foreground">
                {latestStrip.basename}
              </p>
            </div>
          )}

          {/* Prefetch adjacent scenario strips ONLY after current strip loads */}
          {stripImageLoaded && nextScenarioStrip && (
            <div className="hidden">
              <CdnImage
                src={getVersionUrl({ versionId: nextScenarioStrip.versionId, basename: nextScenarioStrip.basename })}
                alt=""
                width={1}
                height={1}
              />
            </div>
          )}
          {stripImageLoaded && prevScenarioStrip && (
            <div className="hidden">
              <CdnImage
                src={getVersionUrl({ versionId: prevScenarioStrip.versionId, basename: prevScenarioStrip.basename })}
                alt=""
                width={1}
                height={1}
              />
            </div>
          )}

          {/* No strip yet */}
          {!isGenerating && !hasResult && !latestStrip && !isNew && (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
              <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                No strip generated yet
              </p>
              <Button
                variant="outline"
                onClick={handleSaveAndRegenerate}
                disabled={isGenerating}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Strip
              </Button>
            </div>
          )}

          {/* New scenario - no strip preview */}
          {isNew && (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
              <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Create the scenario first, then generate a strip
              </p>
            </div>
          )}
        </div>

        {/* Description Section - first on mobile, top-right on desktop */}
        <div className="p-3 md:p-6 rounded-lg border bg-card space-y-4 order-1 lg:order-2">
          <h2 className="text-lg font-semibold">Description</h2>

          <div className="space-y-4">
            {/* Only show name field for new scenarios */}
            {isNew && (
              <div className="space-y-2">
                <Label htmlFor="name">Scenario Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., intro-part1"
                />
              </div>
            )}

            <EditableText
              value={formData.description}
              onChange={(value) =>
                setFormData({ ...formData, description: value })
              }
              placeholder="Brief description of this scenario"
              label={isNew ? "Description" : ""}
            />
          </div>
        </div>

        {/* Frames Section - third on mobile, bottom-right on desktop */}
        <div className="p-3 md:p-6 rounded-lg border bg-card space-y-4 order-3 lg:order-3">
            <h2 className="text-lg font-semibold">Frames</h2>
            <p className="text-sm text-muted-foreground">
              Add frames and select which characters appear in each. The
              characters you select will automatically be included for AI
              generation.
            </p>

            <FrameList
              frames={formData.frames}
              allCharacters={characterData}
              onChange={(frames) => setFormData({ ...formData, frames })}
            />
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black border-none">
          <VisuallyHidden>
            <DialogTitle>Strip Preview</DialogTitle>
            <DialogDescription>Full size preview of the comic strip</DialogDescription>
          </VisuallyHidden>
          <button
            onClick={() => setShowPreviewModal(false)}
            className="relative w-full h-[90vh] cursor-pointer flex items-center justify-center"
          >
            {hasResult ? (
              <CdnImage
                src={submission!.resultUrl!}
                alt={`Comic strip: ${scenarioName}`}
                fill
                className="object-contain"
                sizes="95vw"
              />
            ) : latestStrip ? (
              <CdnImage
                src={getVersionUrl({ versionId: latestStrip.versionId, basename: latestStrip.basename })}
                alt={`Comic strip: ${scenarioName}`}
                fill
                className="object-contain"
                sizes="95vw"
              />
            ) : (
              <p className="text-white/60">No preview available</p>
            )}
          </button>
        </DialogContent>
      </Dialog>

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

function StoryScenarioEditorSkeleton(_props: { storySlug: string }) {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded bg-muted animate-pulse" />
          <div className="h-4 w-64 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-10 w-40 rounded bg-muted animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="p-3 md:p-6 rounded-lg border bg-card order-2 lg:order-1">
          <div className="h-6 w-32 rounded bg-muted animate-pulse mb-4" />
          <div className="aspect-[9/16] rounded bg-muted animate-pulse" />
        </div>
        <div className="space-y-4 md:space-y-6 order-1 lg:order-2">
          {[1, 2].map((i) => (
            <div key={i} className="p-3 md:p-6 rounded-lg border bg-card">
              <div className="h-6 w-32 rounded bg-muted animate-pulse mb-4" />
              <div className="h-24 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
