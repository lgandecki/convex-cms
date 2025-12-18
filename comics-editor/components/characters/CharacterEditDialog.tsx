"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { CdnImage } from "@/components/ui/cdn-image";

interface CharacterMetadata {
  name: string;
  organism: string;
  power: string;
  archetype: string;
  bio: string;
}

interface CharacterEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterKey: string;
  initialMetadata: CharacterMetadata | null;
  comicImageUrl: string | null;
  superheroImageUrl: string | null;
}

export function CharacterEditDialog({
  open,
  onOpenChange,
  characterKey,
  initialMetadata,
  comicImageUrl,
  superheroImageUrl,
}: CharacterEditDialogProps) {
  const updateMetadata = useMutation(api.comics.updateCharacterMetadata);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<CharacterMetadata>({
    name: "",
    organism: "",
    power: "",
    archetype: "",
    bio: "",
  });

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open && initialMetadata) {
      setFormData(initialMetadata);
    } else if (open) {
      // Default values for new character
      setFormData({
        name: characterKey.charAt(0).toUpperCase() + characterKey.slice(1),
        organism: "",
        power: "",
        archetype: "",
        bio: "",
      });
    }
  }, [open, initialMetadata, characterKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateMetadata({
        characterKey,
        metadata: formData,
      });
      toast.success("Character updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update character");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Character: {characterKey}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image preview */}
          <div className="flex gap-4 pb-4 border-b border-border">
            {comicImageUrl && (
              <div className="flex flex-col items-center gap-1">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                  <CdnImage
                    src={comicImageUrl}
                    alt="Comic"
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <span className="text-xs text-muted-foreground">Comic</span>
              </div>
            )}
            {superheroImageUrl && (
              <div className="flex flex-col items-center gap-1">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                  <CdnImage
                    src={superheroImageUrl}
                    alt="Superhero"
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <span className="text-xs text-muted-foreground">Superhero</span>
              </div>
            )}
            {!comicImageUrl && !superheroImageUrl && (
              <div className="text-sm text-muted-foreground">
                No images uploaded yet
              </div>
            )}
          </div>

          {/* Form fields */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Character name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="organism">Organism</Label>
              <Input
                id="organism"
                value={formData.organism}
                onChange={(e) =>
                  setFormData({ ...formData, organism: e.target.value })
                }
                placeholder="e.g., termit kornik, meduza, motylek"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="power">Power</Label>
              <Input
                id="power"
                value={formData.power}
                onChange={(e) =>
                  setFormData({ ...formData, power: e.target.value })
                }
                placeholder="Character's special power or ability"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="archetype">Archetype</Label>
              <Input
                id="archetype"
                value={formData.archetype}
                onChange={(e) =>
                  setFormData({ ...formData, archetype: e.target.value })
                }
                placeholder="e.g., naukowiec, eksplorer, hacker"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bio">Biography</Label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder="Character biography..."
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
