"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { queries } from "@/lib/queries";
import { useStory } from "@/lib/storyContext";

export default function StoryViewerIndexPage() {
  const router = useRouter();
  const { storySlug } = useStory();
  const { data: scenarios } = useQuery(queries.storyScenarios(storySlug));
  const { data: generatedStrips } = useQuery(queries.storyStrips(storySlug));
  const { data: scenarioOrder } = useQuery(
    queries.storyScenarioOrder(storySlug)
  );

  // Find the first scenario that has a generated strip
  const firstScenarioName = useMemo(() => {
    if (!scenarios || !generatedStrips?.length) return null;

    const stripsByScenario = generatedStrips.reduce(
      (acc, strip) => {
        acc[strip.scenarioName] = strip;
        return acc;
      },
      {} as Record<string, (typeof generatedStrips)[number]>
    );

    // Sort scenarios by order
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

    // Find first scenario with a strip
    const firstWithStrip = sortedScenarios.find((s) => stripsByScenario[s.name]);
    return firstWithStrip?.name ?? null;
  }, [scenarios, generatedStrips, scenarioOrder]);

  useEffect(() => {
    if (firstScenarioName) {
      router.replace(
        `/stories/${storySlug}/viewer/${encodeURIComponent(firstScenarioName)}`
      );
    }
  }, [firstScenarioName, storySlug, router]);

  const handleGoBack = () => {
    router.push(`/stories/${storySlug}/scenarios`);
  };

  // Show loading state while redirecting
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      {!firstScenarioName && generatedStrips !== undefined && (
        <div className="text-center">
          <p className="text-white/60 mb-4">No comics available</p>
          <button
            onClick={handleGoBack}
            className="text-white/80 hover:text-white underline"
          >
            Go back
          </button>
        </div>
      )}
    </div>
  );
}
