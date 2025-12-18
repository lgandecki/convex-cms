"use client";

import { CdnImage } from "@/components/ui/cdn-image";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CharacterCardProps {
  characterKey: string;
  name: string;
  organism?: string;
  archetype?: string;
  comicImageUrl: string | null;
  superheroImageUrl: string | null;
  onClick?: () => void;
  selected?: boolean;
}

export function CharacterCard({
  characterKey,
  name,
  organism,
  archetype,
  comicImageUrl,
  superheroImageUrl,
  onClick,
  selected,
}: CharacterCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-all duration-200",
        "hover:border-primary/50 hover:shadow-glow-sm",
        selected && "border-primary ring-2 ring-primary/20"
      )}
    >
      {/* Image area */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {comicImageUrl ? (
          <CdnImage
            src={comicImageUrl}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl font-bold text-muted-foreground/30">
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Superhero overlay on hover */}
        {superheroImageUrl && (
          <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <CdnImage
              src={superheroImageUrl}
              alt={`${name} superhero`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>
        )}

        {/* Has both images badge */}
        {comicImageUrl && superheroImageUrl && (
          <div className="absolute bottom-2 right-2 flex gap-1">
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              2 images
            </Badge>
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="flex flex-col gap-1 p-3 text-left">
        <h3 className="font-semibold text-sm truncate">{name}</h3>
        {archetype && (
          <p className="text-xs text-muted-foreground truncate">{archetype}</p>
        )}
        {organism && (
          <p className="text-xs text-muted-foreground/70 truncate">{organism}</p>
        )}
      </div>
    </button>
  );
}

export function CharacterCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-card">
      <div className="aspect-square bg-muted animate-pulse" />
      <div className="flex flex-col gap-2 p-3">
        <div className="h-4 w-20 rounded bg-muted animate-pulse" />
        <div className="h-3 w-16 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}
