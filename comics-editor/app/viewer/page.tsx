"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { queries } from "@/lib/queries";

export default function ViewerIndexPage() {
  const router = useRouter();
  const { data: scenarios } = useQuery(queries.scenarios());
  const { data: generatedStrips } = useQuery(queries.generatedStrips());
  const { data: scenarioOrder } = useQuery(queries.scenarioOrder());

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
      router.replace(`/viewer/${encodeURIComponent(firstScenarioName)}`);
    }
  }, [firstScenarioName, router]);

  // Show loading state while redirecting
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      {!firstScenarioName && generatedStrips !== undefined && (
        <p className="text-white/60">No comics available</p>
      )}
    </div>
  );
}
