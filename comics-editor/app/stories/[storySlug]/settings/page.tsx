"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useStory } from "@/lib/storyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function StorySettingsPage() {
  const router = useRouter();
  const { storySlug, story, isLoading } = useStory();
  const updateStory = useMutation(api.comics.updateStory);

  const [name, setName] = useState(story?.name ?? "");
  const [description, setDescription] = useState(story?.description ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Update state when story loads
  if (story && name === "" && story.name) {
    setName(story.name);
    setDescription(story.description ?? "");
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a story name");
      return;
    }

    setIsSaving(true);
    try {
      await updateStory({
        slug: storySlug,
        name: name.trim(),
        description: description.trim(),
      });
      toast.success("Story updated!");
    } catch (error) {
      console.error("Failed to update story:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update story"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <StorySettingsSkeleton storySlug={storySlug} />;
  }

  if (!story) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Story Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The story &quot;{storySlug}&quot; doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href="/stories">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Stories
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/stories/${storySlug}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Story Settings</h1>
            <p className="text-muted-foreground">Manage your story details</p>
          </div>
        </div>

        <div className="space-y-6 p-6 rounded-lg border bg-card">
          <div className="space-y-2">
            <Label htmlFor="name">Story Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Story"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="What is this story about?"
              rows={4}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label>Story Slug</Label>
            <p className="text-sm text-muted-foreground font-mono bg-muted px-3 py-2 rounded">
              {storySlug}
            </p>
            <p className="text-xs text-muted-foreground">
              The URL slug cannot be changed after creation.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="space-y-4 p-6 rounded-lg border border-destructive/30 bg-destructive/5">
          <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
          <p className="text-sm text-muted-foreground">
            Deleting a story will remove all its scenarios and generated strips.
            This action cannot be undone.
          </p>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Story
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Story</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{story.name}&quot;? This
              will permanently remove all scenarios and generated strips. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                // TODO: Implement story deletion
                toast.error("Story deletion not yet implemented");
                setShowDeleteDialog(false);
              }}
            >
              Delete Story
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StorySettingsSkeleton({ storySlug }: { storySlug: string }) {
  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/stories/${storySlug}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-2">
            <div className="h-7 w-40 rounded bg-muted animate-pulse" />
            <div className="h-4 w-56 rounded bg-muted animate-pulse" />
          </div>
        </div>

        <div className="space-y-6 p-6 rounded-lg border bg-card">
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="h-10 w-full rounded bg-muted animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="h-24 w-full rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
