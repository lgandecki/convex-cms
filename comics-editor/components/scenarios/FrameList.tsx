"use client";

import { useState, useCallback } from "react";
import { FrameEditor, Frame, CharacterWithImages } from "./FrameEditor";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface FrameListProps {
  frames: Frame[];
  allCharacters: CharacterWithImages[];
  onChange: (frames: Frame[]) => void;
}

export function FrameList({
  frames,
  allCharacters,
  onChange,
}: FrameListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleAddFrame = () => {
    onChange([
      ...frames,
      {
        scene: "",
        characters: [],
        speaker: "",
        dialogue: "",
        imageType: "comic",
      },
    ]);
  };

  const handleUpdateFrame = useCallback(
    (index: number, frame: Frame) => {
      const newFrames = [...frames];
      newFrames[index] = frame;
      onChange(newFrames);
    },
    [frames, onChange]
  );

  const handleDeleteFrame = useCallback(
    (index: number) => {
      onChange(frames.filter((_, i) => i !== index));
    },
    [frames, onChange]
  );

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newFrames = [...frames];
    const [removed] = newFrames.splice(draggedIndex, 1);
    newFrames.splice(dropIndex, 0, removed);
    onChange(newFrames);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Frames ({frames.length})</h3>
        <Button size="sm" variant="outline" onClick={handleAddFrame}>
          <Plus className="h-4 w-4 mr-2" />
          Add Frame
        </Button>
      </div>

      {frames.length === 0 ? (
        <div className="p-8 rounded-lg border border-dashed border-border bg-card/50 text-center">
          <p className="text-muted-foreground mb-4">
            No frames yet. Add your first frame to start building your comic.
          </p>
          <Button onClick={handleAddFrame}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Frame
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {frames.map((frame, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`transition-all ${
                draggedIndex === index ? "opacity-50" : ""
              } ${
                dragOverIndex === index
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : ""
              }`}
            >
              <FrameEditor
                frame={frame}
                index={index}
                allCharacters={allCharacters}
                onChange={(newFrame) => handleUpdateFrame(index, newFrame)}
                onDelete={() => handleDeleteFrame(index)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
