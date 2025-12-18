"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queries } from "@/lib/queries";
import { getVersionUrl } from "@/lib/assetUrl";
import { CharacterCard, CharacterCardSkeleton } from "./CharacterCard";
import { CharacterEditDialog } from "./CharacterEditDialog";

interface CharacterMetadata {
  name: string;
  organism: string;
  power: string;
  archetype: string;
  bio: string;
}

interface ImageRef {
  versionId: string;
  basename: string;
}

interface Character {
  key: string;
  folderPath: string;
  metadata: CharacterMetadata | null;
  comicImage: ImageRef | null;
  superheroImage: ImageRef | null;
  comicImageUrl: string | null;
  superheroImageUrl: string | null;
}

export function CharacterGrid() {
  const { data: characters, isLoading } = useQuery(queries.characters());
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleCharacterClick = (character: Character) => {
    setSelectedCharacter(character);
    setEditDialogOpen(true);
  };

  if (isLoading) {
    return <CharacterGridSkeleton />;
  }

  if (!characters || characters.length === 0) {
    return (
      <div className="p-12 rounded-lg border border-dashed border-border bg-card/50 text-center">
        <p className="text-muted-foreground">
          No characters found. Upload character images to the{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">
            /comics/characters/
          </code>{" "}
          folder.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {characters.map((character) => {
          const comicUrl = character.comicImage
            ? getVersionUrl({ versionId: character.comicImage.versionId, basename: character.comicImage.basename })
            : null;
          const superheroUrl = character.superheroImage
            ? getVersionUrl({ versionId: character.superheroImage.versionId, basename: character.superheroImage.basename })
            : null;

          return (
            <CharacterCard
              key={character.key}
              characterKey={character.key}
              name={character.metadata?.name ?? character.key}
              organism={character.metadata?.organism}
              archetype={character.metadata?.archetype}
              comicImageUrl={comicUrl}
              superheroImageUrl={superheroUrl}
              onClick={() => handleCharacterClick(character)}
            />
          );
        })}
      </div>

      {selectedCharacter && (
        <CharacterEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          characterKey={selectedCharacter.key}
          initialMetadata={selectedCharacter.metadata}
          comicImageUrl={selectedCharacter.comicImage
            ? getVersionUrl({ versionId: selectedCharacter.comicImage.versionId, basename: selectedCharacter.comicImage.basename })
            : null}
          superheroImageUrl={selectedCharacter.superheroImage
            ? getVersionUrl({ versionId: selectedCharacter.superheroImage.versionId, basename: selectedCharacter.superheroImage.basename })
            : null}
        />
      )}
    </>
  );
}

export function CharacterGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <CharacterCardSkeleton key={i} />
      ))}
    </div>
  );
}
