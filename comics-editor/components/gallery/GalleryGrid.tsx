"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { queries } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import {
  Download,
  ExternalLink,
  Clock,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Strip {
  scenarioName: string;
  basename: string;
  url: string;
}

export function GalleryGrid() {
  const { data: strips, isLoading } = useQuery(queries.generatedStrips());
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Flatten all strips for navigation
  const allStrips = strips ?? [];
  const selectedStrip = selectedIndex !== null ? allStrips[selectedIndex] : null;

  const openViewer = (index: number) => {
    setSelectedIndex(index);
  };

  const closeViewer = () => {
    setSelectedIndex(null);
  };

  const goNext = useCallback(() => {
    if (selectedIndex !== null && selectedIndex < allStrips.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  }, [selectedIndex, allStrips.length]);

  const goPrev = useCallback(() => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  }, [selectedIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          goPrev();
          break;
        case "Escape":
          e.preventDefault();
          closeViewer();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, goNext, goPrev]);

  const handleDownload = async (strip: Strip) => {
    try {
      const response = await fetch(strip.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${strip.scenarioName}-${strip.basename}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  if (isLoading) {
    return <GalleryGridSkeleton />;
  }

  if (!strips || strips.length === 0) {
    return (
      <div className="p-12 rounded-lg border border-dashed border-border bg-card/50 text-center">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground mb-4">
          No generated comics yet. Generate your first comic strip from a
          scenario.
        </p>
        <Button variant="outline" asChild>
          <Link href="/generate">Go to Generate</Link>
        </Button>
      </div>
    );
  }

  // Group by scenario
  const groupedStrips = strips.reduce(
    (acc, strip) => {
      if (!acc[strip.scenarioName]) {
        acc[strip.scenarioName] = [];
      }
      acc[strip.scenarioName].push(strip);
      return acc;
    },
    {} as Record<string, Strip[]>
  );

  return (
    <>
      <div className="space-y-8">
        {Object.entries(groupedStrips).map(([scenarioName, scenarioStrips]) => (
          <div key={scenarioName} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{scenarioName}</h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/scenarios/${encodeURIComponent(scenarioName)}`}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit Scenario
                  </Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {scenarioStrips.map((strip) => {
                const globalIndex = allStrips.findIndex(
                  (s) =>
                    s.scenarioName === strip.scenarioName &&
                    s.basename === strip.basename
                );
                return (
                  <button
                    key={`${strip.scenarioName}-${strip.basename}`}
                    onClick={() => openViewer(globalIndex)}
                    className={cn(
                      "group relative overflow-hidden rounded-lg border bg-card",
                      "hover:border-primary/50 hover:shadow-glow-sm transition-all",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                    )}
                  >
                    <div className="aspect-[9/16] overflow-hidden">
                      <img
                        src={strip.url}
                        alt={`${strip.scenarioName} - ${strip.basename}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-white text-sm truncate">
                        {strip.basename}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Full screen viewer */}
      {selectedStrip && selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onClick={closeViewer}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 bg-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <h2 className="text-white font-semibold">
                {selectedStrip.scenarioName}
              </h2>
              <span className="text-white/60 text-sm">
                {selectedIndex + 1} / {allStrips.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                asChild
              >
                <Link
                  href={`/scenarios/${encodeURIComponent(selectedStrip.scenarioName)}`}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                asChild
              >
                <Link
                  href={`/generate?scenario=${encodeURIComponent(selectedStrip.scenarioName)}`}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Regenerate
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(selectedStrip);
                }}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(selectedStrip.url, "_blank");
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  closeViewer();
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Image viewer with navigation */}
          <div className="flex-1 flex items-center justify-center relative p-4">
            {/* Previous button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              disabled={selectedIndex === 0}
              className={cn(
                "absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors",
                selectedIndex === 0 && "opacity-30 cursor-not-allowed"
              )}
            >
              <ChevronLeft className="h-8 w-8 text-white" />
            </button>

            {/* Image */}
            <div
              className="max-h-full max-w-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedStrip.url}
                alt={`${selectedStrip.scenarioName} - ${selectedStrip.basename}`}
                className="max-h-[calc(100vh-120px)] max-w-full object-contain rounded-lg"
              />
            </div>

            {/* Next button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              disabled={selectedIndex === allStrips.length - 1}
              className={cn(
                "absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors",
                selectedIndex === allStrips.length - 1 &&
                  "opacity-30 cursor-not-allowed"
              )}
            >
              <ChevronRight className="h-8 w-8 text-white" />
            </button>
          </div>

          {/* Footer hint */}
          <div className="p-4 text-center text-white/50 text-sm">
            Use ← → arrow keys to navigate • ESC to close
          </div>
        </div>
      )}
    </>
  );
}

function GalleryGridSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="h-6 w-32 rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="aspect-[9/16] rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
