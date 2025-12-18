"use client";

import { use, useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queries } from "@/lib/queries";
import { getVersionUrl } from "@/lib/assetUrl";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CdnImage } from "@/components/ui/cdn-image";
import { cn } from "@/lib/utils";

export default function StoryViewerPage({
  params,
}: {
  params: Promise<{ storySlug: string; scenarioName: string }>;
}) {
  const { storySlug, scenarioName } = use(params);
  const router = useRouter();
  const { data: scenarios } = useQuery(queries.storyScenarios(storySlug));
  const { data: generatedStrips } = useQuery(queries.storyStrips(storySlug));
  const { data: scenarioOrder } = useQuery(
    queries.storyScenarioOrder(storySlug)
  );

  // Track when current image has loaded for prefetching
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleClose = useCallback(() => {
    router.push(`/stories/${storySlug}/scenarios`);
  }, [router, storySlug]);

  // Sort scenarios by saved order and filter to only those with generated strips
  const orderedStrips = useMemo(() => {
    if (!scenarios || !generatedStrips) return [];

    const stripsByScenario = generatedStrips.reduce(
      (acc, strip) => {
        acc[strip.scenarioName] = strip;
        return acc;
      },
      {} as Record<string, (typeof generatedStrips)[number]>
    );

    let sortedScenarios = [...scenarios];
    if (scenarioOrder?.order) {
      const order = scenarioOrder.order;
      sortedScenarios.sort((a, b) => {
        const aIndex = order.indexOf(a.name);
        const bIndex = order.indexOf(b.name);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    }

    return sortedScenarios
      .filter((s) => stripsByScenario[s.name])
      .map((s) => stripsByScenario[s.name]);
  }, [scenarios, generatedStrips, scenarioOrder]);

  // Find current index from URL param
  const currentIndex = useMemo(() => {
    const decoded = decodeURIComponent(scenarioName);
    return orderedStrips.findIndex((s) => s.scenarioName === decoded);
  }, [orderedStrips, scenarioName]);

  const currentStrip = orderedStrips[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < orderedStrips.length - 1;
  const prevStrip = hasPrev ? orderedStrips[currentIndex - 1] : null;
  const nextStrip = hasNext ? orderedStrips[currentIndex + 1] : null;

  // Reset imageLoaded when navigating to new image
  useEffect(() => {
    setImageLoaded(false);
  }, [currentStrip?.scenarioName]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && prevStrip) {
        router.push(
          `/stories/${storySlug}/viewer/${encodeURIComponent(prevStrip.scenarioName)}`
        );
      } else if (e.key === "ArrowRight" && nextStrip) {
        router.push(
          `/stories/${storySlug}/viewer/${encodeURIComponent(nextStrip.scenarioName)}`
        );
      } else if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, storySlug, prevStrip, nextStrip, handleClose]);

  if (!currentStrip) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 mb-4">No comics available</p>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {/* Progress indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        {currentIndex + 1} / {orderedStrips.length}
      </div>

      {/* Previous button */}
      {prevStrip ? (
        <Link
          href={`/stories/${storySlug}/viewer/${encodeURIComponent(prevStrip.scenarioName)}`}
          prefetch={true}
          className="absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="h-8 w-8 text-white" />
        </Link>
      ) : (
        <button
          disabled
          className="absolute left-4 z-10 p-3 rounded-full bg-white/10 opacity-30 cursor-not-allowed"
        >
          <ChevronLeft className="h-8 w-8 text-white" />
        </button>
      )}

      {/* Image */}
      <div className="relative w-full h-full flex items-center justify-center">
        <CdnImage
          src={getVersionUrl({
            versionId: currentStrip.versionId,
            basename: currentStrip.basename,
          })}
          alt={currentStrip.scenarioName}
          fill
          className="object-contain"
          sizes="100vw"
          priority
          onLoad={() => setImageLoaded(true)}
        />
      </div>

      {/* Next button */}
      {nextStrip ? (
        <Link
          href={`/stories/${storySlug}/viewer/${encodeURIComponent(nextStrip.scenarioName)}`}
          prefetch={true}
          className="absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronRight className="h-8 w-8 text-white" />
        </Link>
      ) : (
        <button
          disabled
          className="absolute right-4 z-10 p-3 rounded-full bg-white/10 opacity-30 cursor-not-allowed"
        >
          <ChevronRight className="h-8 w-8 text-white" />
        </button>
      )}

      {/* Prefetch adjacent images ONLY after current image loads */}
      {imageLoaded && nextStrip && (
        <div className="sr-only" aria-hidden="true">
          <CdnImage
            src={getVersionUrl({
              versionId: nextStrip.versionId,
              basename: nextStrip.basename,
            })}
            alt=""
            fill
          />
        </div>
      )}
      {imageLoaded && prevStrip && (
        <div className="sr-only" aria-hidden="true">
          <CdnImage
            src={getVersionUrl({
              versionId: prevStrip.versionId,
              basename: prevStrip.basename,
            })}
            alt=""
            fill
          />
        </div>
      )}
    </div>
  );
}
