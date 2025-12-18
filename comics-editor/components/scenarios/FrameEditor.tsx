"use client";

import { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, Check, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { CdnImage } from "@/components/ui/cdn-image";

// Inline editable text component
export function EditableText({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          className="flex min-h-[80px] w-full rounded-md border border-primary bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
        />
        <p className="text-xs text-muted-foreground">
          Press Enter to save, Shift+Enter for new line, Escape to cancel
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {label && <Label className="text-muted-foreground">{label}</Label>}
      <button
        onClick={() => setIsEditing(true)}
        className={cn(
          "w-full text-left px-3 py-2 rounded-md border border-dashed border-border/50 hover:border-border hover:bg-muted/50 transition-colors group flex items-start gap-2",
          !value && "text-muted-foreground italic"
        )}
      >
        <span className="flex-1 whitespace-pre-wrap text-sm">
          {value || placeholder}
        </span>
        <Pencil className="h-3 w-3 mt-1 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0" />
      </button>
    </div>
  );
}

export interface FrameCharacter {
  key: string;
  imageType: "comic" | "superhero";
}

export interface Frame {
  scene: string;
  characters: string[];
  // Track which image type each character uses in this frame
  characterImageTypes?: Record<string, "comic" | "superhero" | "both">;
  speaker: string;
  dialogue: string;
  imageType: "comic" | "superhero";
}

export interface CharacterWithImages {
  key: string;
  name: string;
  comicImageUrl: string | null;
  superheroImageUrl: string | null;
}

interface FrameEditorProps {
  frame: Frame;
  index: number;
  allCharacters: CharacterWithImages[];
  onChange: (frame: Frame) => void;
  onDelete: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function FrameEditor({
  frame,
  index,
  allCharacters,
  onChange,
  onDelete,
  dragHandleProps,
}: FrameEditorProps) {
  // Track selected images as a Set of "characterKey:imageType" strings
  const selectedImages = new Set<string>();
  for (const char of frame.characters) {
    const types = frame.characterImageTypes?.[char];
    if (types === "comic" || types === "both") {
      selectedImages.add(`${char}:comic`);
    }
    if (types === "superhero" || types === "both") {
      selectedImages.add(`${char}:superhero`);
    }
    // Legacy support: if no per-character type, use frame.imageType
    if (!types) {
      selectedImages.add(`${char}:${frame.imageType}`);
    }
  }

  const toggleCharacterImage = (
    characterKey: string,
    imageType: "comic" | "superhero",
  ) => {
    const key = `${characterKey}:${imageType}`;
    const wasSelected = selectedImages.has(key);

    // Toggle this specific image
    if (wasSelected) {
      selectedImages.delete(key);
    } else {
      selectedImages.add(key);
    }

    // Rebuild characters and characterImageTypes from selectedImages
    const newCharacters: string[] = [];
    const newImageTypes: Record<string, "comic" | "superhero" | "both"> = {};

    for (const entry of selectedImages) {
      const [charKey, type] = entry.split(":") as [
        string,
        "comic" | "superhero",
      ];
      if (!newCharacters.includes(charKey)) {
        newCharacters.push(charKey);
      }

      const existing = newImageTypes[charKey];
      if (!existing) {
        newImageTypes[charKey] = type;
      } else if (existing !== type) {
        newImageTypes[charKey] = "both";
      }
    }

    onChange({
      ...frame,
      characters: newCharacters,
      characterImageTypes: newImageTypes,
      // Clear speaker if removed
      speaker: newCharacters.includes(frame.speaker) ? frame.speaker : "",
    });
  };

  const isSelected = (
    characterKey: string,
    imageType: "comic" | "superhero",
  ) => {
    return selectedImages.has(`${characterKey}:${imageType}`);
  };

  return (
    <div className="relative p-4 rounded-lg border bg-card group">
      {/* Drag handle and frame number */}
      <div className="flex items-center gap-2 mb-4">
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-muted"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          Frame {index + 1}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="ml-auto md:opacity-0 md:group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Scene description */}
        <EditableText
          value={frame.scene}
          onChange={(value) => onChange({ ...frame, scene: value })}
          placeholder="Describe the visual scene..."
          label="Scene Description"
        />

        {/* Characters in frame */}
        <div className="space-y-2">
          <Label>Characters in Frame</Label>
          {allCharacters.length === 0 ? (
            <span className="text-sm text-muted-foreground">
              No characters available
            </span>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {allCharacters.flatMap((char) => {
                const images: React.ReactNode[] = [];

                if (char.comicImageUrl) {
                  images.push(
                    <button
                      key={`${char.key}-comic`}
                      onClick={() => toggleCharacterImage(char.key, "comic")}
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden transition-all",
                        isSelected(char.key, "comic")
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                          : "md:opacity-40 md:hover:opacity-70",
                      )}
                    >
                      <CdnImage
                        src={char.comicImageUrl}
                        alt={`${char.name} comic`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                      {isSelected(char.key, "comic") && (
                        <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                          <Check className="h-6 w-6 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </button>,
                  );
                }

                if (char.superheroImageUrl) {
                  images.push(
                    <button
                      key={`${char.key}-superhero`}
                      onClick={() =>
                        toggleCharacterImage(char.key, "superhero")
                      }
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden transition-all",
                        isSelected(char.key, "superhero")
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                          : "md:opacity-40 md:hover:opacity-70",
                      )}
                    >
                      <CdnImage
                        src={char.superheroImageUrl}
                        alt={`${char.name} superhero`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                      {isSelected(char.key, "superhero") && (
                        <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                          <Check className="h-6 w-6 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </button>,
                  );
                }

                return images;
              })}
            </div>
          )}
        </div>

        {/* Speaker */}
        <div className="space-y-2">
          <Label htmlFor={`speaker-${index}`}>Speaker</Label>
          <select
            id={`speaker-${index}`}
            value={frame.speaker}
            onChange={(e) => onChange({ ...frame, speaker: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Select speaker...</option>
            {frame.characters.map((charKey) => {
              const char = allCharacters.find((c) => c.key === charKey);
              return (
                <option key={charKey} value={charKey}>
                  {char?.name ?? charKey}
                </option>
              );
            })}
          </select>
        </div>

        {/* Dialogue */}
        <EditableText
          value={frame.dialogue}
          onChange={(value) => onChange({ ...frame, dialogue: value })}
          placeholder="What does the speaker say?"
          label="Dialogue"
        />
      </div>
    </div>
  );
}
