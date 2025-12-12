// src/routes/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import Odyssey from "@/odyssey/Odyssey";
import "@/odyssey/index.css";
import { fetchOdysseyAudioFiles } from "@/server/convexHttp";

const getOdysseyData = createServerFn({ method: "GET" }).handler(async () => {
  return await fetchOdysseyAudioFiles();
});

export const Route = createFileRoute("/")({
  loader: async () => {
    return await getOdysseyData();
  },
  component: OdysseyPage,
});

function OdysseyPage() {
  const { chapter1Files, chapter2Files } = Route.useLoaderData();
  return (
    <Odyssey
      initialChapter1Files={chapter1Files}
      initialChapter2Files={chapter2Files}
    />
  );
}
