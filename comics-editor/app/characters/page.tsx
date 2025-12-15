"use client";

import { CharacterGrid } from "@/components/characters/CharacterGrid";

export default function CharactersPage() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Characters</h1>
          <p className="text-muted-foreground">
            Browse and edit your comic characters. Click on a character to edit
            their metadata.
          </p>
        </div>

        <CharacterGrid />
      </div>
    </div>
  );
}
