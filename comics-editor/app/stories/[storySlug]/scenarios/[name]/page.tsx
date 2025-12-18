"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { StoryScenarioEditor } from "@/components/scenarios/StoryScenarioEditor";

export default function StoryScenarioEditorPage({
  params,
}: {
  params: Promise<{ storySlug: string; name: string }>;
}) {
  const { storySlug, name } = use(params);
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "true";

  return (
    <div className="p-2 md:p-6 min-h-full">
      <StoryScenarioEditor
        storySlug={storySlug}
        scenarioName={decodeURIComponent(name)}
        isNew={isNew}
      />
    </div>
  );
}
