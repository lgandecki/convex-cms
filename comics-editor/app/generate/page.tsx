"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GenerationPanel } from "@/components/generation/GenerationPanel";

function GenerateContent() {
  const searchParams = useSearchParams();
  const preselectedScenario = searchParams.get("scenario");

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Generate Comic Strip</h1>
          <p className="text-muted-foreground">
            Select a scenario and generate a comic strip using AI. The process
            may take a few minutes.
          </p>
        </div>

        <GenerationPanel preselectedScenario={preselectedScenario ?? undefined} />
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <GenerateContent />
    </Suspense>
  );
}
