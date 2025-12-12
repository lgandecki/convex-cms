import { useState } from "react";
import { Toaster } from "sonner";
import { FolderTree } from "./components/FolderTree";
import { AssetList } from "./components/AssetList";
import { AssetDetail } from "./components/AssetDetail";
import { CreateFolderDialog } from "./components/CreateFolderDialog";
import { UploadDialog } from "./components/UploadDialog";
import { CodeSnippetDialog } from "./components/CodeSnippetDialog";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AdminPanel() {
  // Navigation state
  const [selectedFolderPath, setSelectedFolderPath] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<{
    folderPath: string;
    basename: string;
  } | null>(null);

  // Dialog state
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

  const handleAssetSelect = (asset: { folderPath: string; basename: string }) => {
    setSelectedAsset(asset);
  };

  const handleCloseDetail = () => {
    setSelectedAsset(null);
  };

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background">
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Folder Tree */}
          <FolderTree
            selectedFolderPath={selectedFolderPath}
            onFolderSelect={setSelectedFolderPath}
            onCreateFolder={handleCreateFolder}
          />

          {/* Middle: Asset List */}
          <AssetList
            folderPath={selectedFolderPath}
            onAssetSelect={handleAssetSelect}
            onFolderSelect={setSelectedFolderPath}
            onUploadNew={handleUploadNew}
            onCreateAsset={() => {
              // For now, just open upload dialog
              handleUploadNew();
            }}
            onShowSnippet={() => setSnippetOpen(true)}
          />

          {/* Right: Asset Detail (conditional) */}
          {selectedAsset && (
            <AssetDetail
              folderPath={selectedAsset.folderPath}
              basename={selectedAsset.basename}
              onClose={handleCloseDetail}
              onUploadNew={() => handleUploadNewVersion(selectedAsset.basename)}
            />
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
          folderPath={selectedFolderPath}
          existingBasename={uploadBasename}
        />

        <CodeSnippetDialog
          open={snippetOpen}
          onOpenChange={setSnippetOpen}
          folderPath={selectedFolderPath}
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
