import { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { queries } from "../../routes/index";
import {
  Grid3X3,
  List,
  Search,
  X,
  Plus,
  Upload,
  Code,
  FolderOpen,
  Folder,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AssetCard, type AssetData } from "./AssetCard";
import { AssetListRow } from "./AssetListRow";
import { getContentTypeCategory } from "@/lib/utils";
import { toast } from "sonner";

interface AssetListProps {
  folderPath: string;
  onAssetSelect: (asset: { folderPath: string; basename: string }) => void;
  onFolderSelect: (path: string) => void;
  onUploadNew: () => void;
  onCreateAsset: () => void;
  onCreateFolder: () => void;
  onShowSnippet: () => void;
}

interface FolderData {
  _id: string;
  path: string;
  name: string;
  _creationTime: number;
}

// Folder card for grid view
function FolderGridItem({
  folder,
  onClick,
}: {
  folder: FolderData;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all duration-200 text-left w-full"
    >
      <div className="aspect-video bg-muted flex items-center justify-center">
        <Folder className="h-16 w-16 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate flex-1">
            {folder.name}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <Badge variant="secondary" className="mt-2 text-xs">
          Folder
        </Badge>
      </div>
    </button>
  );
}

// Folder row for list view
function FolderListItem({
  folder,
  onClick,
}: {
  folder: FolderData;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group w-full flex items-center gap-4 px-4 py-3 border-b border-border hover:bg-accent/50 transition-colors text-left"
    >
      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Folder className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{folder.name}</p>
        <p className="text-xs text-muted-foreground">Folder</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

type ContentTypeFilter =
  | "all"
  | "image"
  | "audio"
  | "video"
  | "text"
  | "json"
  | "other";

const typeFilters: { value: ContentTypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
  { value: "text", label: "Text" },
  { value: "json", label: "JSON" },
  { value: "other", label: "Other" },
];

export function AssetList({
  folderPath,
  onAssetSelect,
  onFolderSelect,
  onUploadNew,
  onCreateAsset,
  onCreateFolder,
  onShowSnippet,
}: AssetListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContentTypeFilter>("all");
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);

  // Upload mutations
  const generateUploadUrl = useMutation(api.generateUploadUrl.generateUploadUrl);
  const commitUpload = useMutation(api.generateUploadUrl.commitUpload);

  // Handle file drop upload
  const handleFileDrop = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadingFileName(file.name);

    try {
      // 1. Get upload URL
      const uploadUrl = await generateUploadUrl();

      // 2. Upload file
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await res.json();

      // 3. Commit the upload with original filename, published immediately
      await commitUpload({
        folderPath,
        basename: file.name,
        storageId,
        publish: true,
      });

      toast.success(`"${file.name}" uploaded and published`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to upload file";
      toast.error(message);
    } finally {
      setIsUploading(false);
      setUploadingFileName(null);
    }
  }, [folderPath, generateUploadUrl, commitUpload]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragOver to false if we're leaving the container entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Upload first file (could extend to support multiple)
      handleFileDrop(files[0]);
    }
  }, [handleFileDrop]);

  // Non-suspense queries so SSR renders instantly with loading state
  const { data: subfolders, isLoading: subfoldersLoading } = useQuery(queries.folders(folderPath));
  const { data: assets, isLoading: assetsLoading } = useQuery(queries.assets(folderPath));
  const { data: publishedFiles, isLoading: publishedLoading } = useQuery(queries.publishedFilesInFolder(folderPath));

  // All hooks must be called before any conditional returns
  // Create a lookup map for published info
  const publishedInfoMap = useMemo(() => {
    const map = new Map<
      string,
      { contentType?: string; size?: number; url?: string }
    >();
    if (!publishedFiles) return map;
    for (const file of publishedFiles) {
      map.set(file.basename, {
        contentType: file.contentType,
        size: file.size,
        url: file.url,
      });
    }
    return map;
  }, [publishedFiles]);

  // Filter subfolders by search query
  const filteredFolders = useMemo(() => {
    if (!subfolders) return [];
    if (!searchQuery) return subfolders;
    return subfolders.filter((folder) =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [subfolders, searchQuery]);

  // Filter assets
  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    return assets.filter((asset) => {
      // Search filter
      if (
        searchQuery &&
        !asset.basename.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Type filter
      if (typeFilter !== "all") {
        const info = publishedInfoMap.get(asset.basename);
        const category = getContentTypeCategory(info?.contentType);
        if (category !== typeFilter) {
          return false;
        }
      }

      return true;
    });
  }, [assets, searchQuery, typeFilter, publishedInfoMap]);

  const isLoading = subfoldersLoading || assetsLoading || publishedLoading;

  if (isLoading || !subfolders || !assets) {
    return <AssetListSkeleton />;
  }

  const isEmpty = filteredAssets.length === 0 && filteredFolders.length === 0;
  const hasNoContent = assets.length === 0 && subfolders.length === 0;

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop zone overlay */}
      {(dragOver || isUploading) && (
        <div className="absolute inset-0 z-50 pointer-events-none">
          {/* Semi-transparent backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

          {/* Edge highlight border */}
          <div className={cn(
            "absolute inset-3 rounded-xl border-2 border-dashed transition-colors",
            isUploading ? "border-primary" : "border-primary animate-pulse"
          )} />

          {/* Corner accents */}
          <div className="absolute top-3 left-3 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-xl" />
          <div className="absolute top-3 right-3 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-xl" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-xl" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-xl" />

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            {isUploading ? (
              <>
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">Uploading...</p>
                  <p className="text-sm text-muted-foreground mt-1">{uploadingFileName}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-10 w-10 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">Drop file to upload</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    to <span className="font-mono text-primary">{folderPath || "(root)"}</span>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        {/* Top row: path and actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FolderOpen className="h-4 w-4" />
            <span className="font-mono">
              {folderPath || "(root)"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onShowSnippet}>
              <Code className="h-4 w-4 mr-2" />
              Snippet
            </Button>
            <Button variant="outline" size="sm" onClick={onCreateFolder}>
              <Folder className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <Button variant="outline" size="sm" onClick={onCreateAsset}>
              <Plus className="h-4 w-4 mr-2" />
              New Asset
            </Button>
            <Button size="sm" onClick={onUploadNew}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        {/* Bottom row: search, filters, view toggle */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Type filters */}
          <div className="flex items-center gap-1">
            {typeFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={typeFilter === filter.value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTypeFilter(filter.value)}
                className="text-xs"
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center border border-border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Active filters */}
        {(searchQuery || typeFilter !== "all") && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Filters:</span>
            {searchQuery && (
              <Badge
                variant="secondary"
                className="text-xs cursor-pointer"
                onClick={() => setSearchQuery("")}
              >
                Search: {searchQuery}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
            {typeFilter !== "all" && (
              <Badge
                variant="secondary"
                className="text-xs cursor-pointer"
                onClick={() => setTypeFilter("all")}
              >
                Type: {typeFilter}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {hasNoContent ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-foreground">This folder is empty</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Upload an asset or create a subfolder to get started
              </p>
            </div>
            <Button onClick={onUploadNew}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Asset
            </Button>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-foreground">No matches found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filters
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setTypeFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* Folders first */}
            {filteredFolders.map((folder, index) => (
              <div
                key={folder._id}
                className={cn("stagger-" + Math.min(index + 1, 6))}
              >
                <FolderGridItem
                  folder={folder}
                  onClick={() => onFolderSelect(folder.path)}
                />
              </div>
            ))}
            {/* Then assets */}
            {filteredAssets.map((asset, index) => (
              <div
                key={asset._id}
                className={cn("stagger-" + Math.min(index + filteredFolders.length + 1, 6))}
              >
                <AssetCard
                  asset={asset as AssetData}
                  publishedInfo={publishedInfoMap.get(asset.basename)}
                  onClick={() =>
                    onAssetSelect({
                      folderPath: asset.folderPath,
                      basename: asset.basename,
                    })
                  }
                  onUpload={onUploadNew}
                />
              </div>
            ))}
          </div>
        ) : (
          <div>
            {/* Folders first */}
            {filteredFolders.map((folder, index) => (
              <div
                key={folder._id}
                className={cn("stagger-" + Math.min(index + 1, 6))}
              >
                <FolderListItem
                  folder={folder}
                  onClick={() => onFolderSelect(folder.path)}
                />
              </div>
            ))}
            {/* Then assets */}
            {filteredAssets.map((asset, index) => (
              <div
                key={asset._id}
                className={cn("stagger-" + Math.min(index + filteredFolders.length + 1, 6))}
              >
                <AssetListRow
                  asset={asset as AssetData}
                  publishedInfo={publishedInfoMap.get(asset.basename)}
                  onClick={() =>
                    onAssetSelect({
                      folderPath: asset.folderPath,
                      basename: asset.basename,
                    })
                  }
                  onUpload={onUploadNew}
                />
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// Skeleton shown during direct navigation (before data loads)
export function AssetListSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header skeleton */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-muted animate-pulse" />
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-20 rounded bg-muted animate-pulse" />
            <div className="h-8 w-24 rounded bg-muted animate-pulse" />
            <div className="h-8 w-20 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-64 rounded bg-muted animate-pulse" />
          <div className="flex gap-1">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-8 w-14 rounded bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      {/* Grid skeleton */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="aspect-video bg-muted animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                <div className="flex gap-1">
                  <div className="h-5 w-16 rounded bg-muted animate-pulse" />
                  <div className="h-5 w-12 rounded bg-muted animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
