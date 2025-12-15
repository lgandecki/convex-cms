"use client";

import { useQuery } from "@tanstack/react-query";
import { queries } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type ImageType = "comic" | "superhero" | "both";

interface CharacterSelectorProps {
  selectedCharacters: Record<string, ImageType>;
  onChange: (characters: Record<string, ImageType>) => void;
}

export function CharacterSelector({
  selectedCharacters,
  onChange,
}: CharacterSelectorProps) {
  const { data: characters, isLoading } = useQuery(queries.characters());

  const toggleImage = (
    characterKey: string,
    imageType: "comic" | "superhero"
  ) => {
    const current = selectedCharacters[characterKey];

    if (!current) {
      // Not selected -> select this type
      onChange({ ...selectedCharacters, [characterKey]: imageType });
    } else if (current === imageType) {
      // Same type selected -> deselect entirely
      const { [characterKey]: _, ...rest } = selectedCharacters;
      onChange(rest);
    } else if (current === "both") {
      // Both selected -> deselect this type, keep the other
      const otherType = imageType === "comic" ? "superhero" : "comic";
      onChange({ ...selectedCharacters, [characterKey]: otherType });
    } else {
      // Other type selected -> select both
      onChange({ ...selectedCharacters, [characterKey]: "both" });
    }
  };

  const isSelected = (characterKey: string, imageType: "comic" | "superhero") => {
    const current = selectedCharacters[characterKey];
    return current === imageType || current === "both";
  };

  if (isLoading) {
    return <CharacterSelectorSkeleton />;
  }

  if (!characters || characters.length === 0) {
    return (
      <div className="p-4 rounded-lg border border-dashed border-border bg-card/50 text-center text-sm text-muted-foreground">
        No characters available. Add characters first.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Click on the comic or superhero image to include that version in the scenario
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {characters.map((character) => {
          const name = character.metadata?.name ?? character.key;
          const hasComic = !!character.comicImageUrl;
          const hasSuperhero = !!character.superheroImageUrl;

          return (
            <div
              key={character.key}
              className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
            >
              {/* Character name */}
              <span className="text-sm font-medium">{name}</span>

              {/* Image selection */}
              <div className="flex gap-2">
                {/* Comic image */}
                <button
                  onClick={() => hasComic && toggleImage(character.key, "comic")}
                  disabled={!hasComic}
                  className={cn(
                    "relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                    hasComic ? "cursor-pointer" : "cursor-not-allowed opacity-40",
                    isSelected(character.key, "comic")
                      ? "border-blue-500 ring-2 ring-blue-500/30"
                      : "border-transparent hover:border-blue-500/50"
                  )}
                >
                  {character.comicImageUrl ? (
                    <img
                      src={character.comicImageUrl}
                      alt={`${name} comic`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      N/A
                    </div>
                  )}
                  {isSelected(character.key, "comic") && (
                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                      <Check className="h-6 w-6 text-blue-500" />
                    </div>
                  )}
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-white text-center py-0.5">
                    Comic
                  </span>
                </button>

                {/* Superhero image */}
                <button
                  onClick={() =>
                    hasSuperhero && toggleImage(character.key, "superhero")
                  }
                  disabled={!hasSuperhero}
                  className={cn(
                    "relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                    hasSuperhero
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-40",
                    isSelected(character.key, "superhero")
                      ? "border-red-500 ring-2 ring-red-500/30"
                      : "border-transparent hover:border-red-500/50"
                  )}
                >
                  {character.superheroImageUrl ? (
                    <img
                      src={character.superheroImageUrl}
                      alt={`${name} superhero`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      N/A
                    </div>
                  )}
                  {isSelected(character.key, "superhero") && (
                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                      <Check className="h-6 w-6 text-red-500" />
                    </div>
                  )}
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-white text-center py-0.5">
                    Hero
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CharacterSelectorSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <div className="h-4 w-16 rounded bg-muted animate-pulse" />
          <div className="flex gap-2">
            <div className="w-16 h-16 rounded-lg bg-muted animate-pulse" />
            <div className="w-16 h-16 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
