"use client";

import { useSearchParams } from "next/navigation";
import { use } from "react";
import { ScenarioEditor } from "@/components/scenarios/ScenarioEditor";

export default function ScenarioEditorPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "true";

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <ScenarioEditor scenarioName={decodeURIComponent(name)} isNew={isNew} />
      </div>
    </div>
  );
}
