"use client";

import { useState, Suspense } from "react";
import { Toaster } from "sonner";
import { FolderTree, FolderTreeSkeleton } from "./components/FolderTree";
import { AssetList, AssetListSkeleton } from "./components/AssetList";
import { AssetDetail, AssetDetailSkeleton } from "./components/AssetDetail";
import { CreateFolderDialog } from "./components/CreateFolderDialog";
import { UploadDialog } from "./components/UploadDialog";
import { CodeSnippetDialog } from "./components/CodeSnippetDialog";
import { TooltipProvider } from "@/components/ui/tooltip";

interface AdminPanelProps {
  folderPath: string;
  selectedAsset: { folderPath: string; basename: string } | null;
  selectedVersionId: string | null;
  onFolderSelect: (folderPath: string) => void;
  onAssetSelect: (asset: { folderPath: string; basename: string } | null) => void;
  onVersionSelect: (versionId: string | null) => void;
}

export function AdminPanel({
  folderPath,
  selectedAsset,
  selectedVersionId,
  onFolderSelect,
  onAssetSelect,
  onVersionSelect,
}: AdminPanelProps) {
  // Dialog state (local, not URL-based)
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createFolderParentPath, setCreateFolderParentPath] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadBasename, setUploadBasename] = useState<string | undefined>();
  const [snippetOpen, setSnippetOpen] = useState(false);

  // Handlers
  const handleCreateFolder = (parentPath: string) => {
    setCreateFolderParentPath(parentPath);
    setCreateFolderOpen(true);
  };

  const handleUploadNew = () => {
    setUploadBasename(undefined);
    setUploadOpen(true);
  };

  const handleUploadNewVersion = (basename: string) => {
    setUploadBasename(basename);
    setUploadOpen(true);
  };

  const handleCloseDetail = () => {
    onAssetSelect(null);
  };

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background">
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Folder Tree */}
          <Suspense fallback={<FolderTreeSkeleton />}>
            <FolderTree
              selectedFolderPath={folderPath}
              onFolderSelect={onFolderSelect}
              onCreateFolder={handleCreateFolder}
            />
          </Suspense>

          {/* Middle: Asset List */}
          <Suspense fallback={<AssetListSkeleton />}>
            <AssetList
              folderPath={folderPath}
              onAssetSelect={onAssetSelect}
              onFolderSelect={onFolderSelect}
              onUploadNew={handleUploadNew}
              onCreateAsset={() => {
                handleUploadNew();
              }}
              onCreateFolder={() => handleCreateFolder(folderPath)}
              onShowSnippet={() => setSnippetOpen(true)}
            />
          </Suspense>

          {/* Right: Asset Detail (conditional) */}
          {selectedAsset && (
            <Suspense fallback={<AssetDetailSkeleton />}>
              <AssetDetail
                folderPath={selectedAsset.folderPath}
                basename={selectedAsset.basename}
                selectedVersionId={selectedVersionId}
                onVersionSelect={onVersionSelect}
                onClose={handleCloseDetail}
                onUploadNew={() => handleUploadNewVersion(selectedAsset.basename)}
              />
            </Suspense>
          )}
        </div>

        {/* Dialogs */}
        <CreateFolderDialog
          open={createFolderOpen}
          onOpenChange={setCreateFolderOpen}
          parentPath={createFolderParentPath}
        />

        <UploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          folderPath={folderPath}
          existingBasename={uploadBasename}
        />

        <CodeSnippetDialog
          open={snippetOpen}
          onOpenChange={setSnippetOpen}
          folderPath={folderPath}
        />

        {/* Toast notifications */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              color: "var(--color-foreground)",
            },
          }}
        />
      </div>
    </TooltipProvider>
  );
}
