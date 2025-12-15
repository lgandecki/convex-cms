"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScenarioList } from "@/components/scenarios/ScenarioList";
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

export default function ScenariosPage() {
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState("");

  const handleCreate = () => {
    if (newScenarioName.trim()) {
      router.push(`/scenarios/${encodeURIComponent(newScenarioName)}?new=true`);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Scenarios</h1>
          <p className="text-muted-foreground">
            Create and manage your comic scenarios. Each scenario defines the
            characters and frames for a comic strip.
          </p>
        </div>

        <ScenarioList onCreateNew={() => setCreateDialogOpen(true)} />

        {/* Create New Scenario Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Scenario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="scenarioName">Scenario Name</Label>
                <Input
                  id="scenarioName"
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  placeholder="e.g., intro-part1, heroes-battle"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreate();
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Use lowercase letters, numbers, and hyphens. This will be the
                  file name.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newScenarioName.trim()}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
