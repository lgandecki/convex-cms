"use client";

import { use } from "react";
import { StoryProvider } from "@/lib/storyContext";

export default function StoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storySlug: string }>;
}) {
  const { storySlug } = use(params);

  return <StoryProvider storySlug={storySlug}>{children}</StoryProvider>;
}
