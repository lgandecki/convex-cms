"use client";

import { Button } from "@/components/ui/button";
import { Check, RefreshCw, X, Loader2 } from "lucide-react";
import { CdnImage } from "@/components/ui/cdn-image";

interface GenerationResultProps {
  imageUrl: string;
  scenarioName: string;
  onUseVersion: () => Promise<void>;
  onTryAgain: () => void;
  onDiscard: () => void;
  isSaving?: boolean;
}

export function GenerationResult({
  imageUrl,
  scenarioName,
  onUseVersion,
  onTryAgain,
  onDiscard,
  isSaving,
}: GenerationResultProps) {
  return (
    <div className="space-y-4">
      {/* Image preview */}
      <div className="relative rounded-lg overflow-hidden border bg-card aspect-[9/16]">
        <CdnImage
          src={imageUrl}
          alt={`Generated comic: ${scenarioName}`}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={onUseVersion} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          {isSaving ? "Saving..." : "Keep"}
        </Button>
        <Button onClick={onTryAgain} variant="outline" disabled={isSaving}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
        <Button onClick={onDiscard} variant="ghost" disabled={isSaving}>
          <X className="h-4 w-4 mr-2" />
          Reject
        </Button>
      </div>
    </div>
  );
}
