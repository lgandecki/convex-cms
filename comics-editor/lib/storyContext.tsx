"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { queries } from "./queries";

interface Story {
  slug: string;
  name: string;
  description: string;
  createdAt?: number;
  updatedAt?: number;
}

interface StoryContextValue {
  storySlug: string;
  story: Story | null | undefined;
  isLoading: boolean;
}

const StoryContext = createContext<StoryContextValue | null>(null);

export function StoryProvider({
  storySlug,
  children,
}: {
  storySlug: string;
  children: ReactNode;
}) {
  const { data: story, isLoading } = useQuery(queries.story(storySlug));

  return (
    <StoryContext.Provider value={{ storySlug, story, isLoading }}>
      {children}
    </StoryContext.Provider>
  );
}

export function useStory() {
  const context = useContext(StoryContext);
  if (!context) {
    throw new Error("useStory must be used within a StoryProvider");
  }
  return context;
}

export function useOptionalStory() {
  return useContext(StoryContext);
}
