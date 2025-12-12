import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import {
  X,
  Copy,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Archive,
  Image,
  Music,
  Video,
  FileText,
  FileJson,
  Package,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getContentTypeCategory, formatBytes } from "@/lib/utils";
import { getVersionUrl } from "@/assetUrl";
import { toast } from "sonner";

interface AssetDetailProps {
  folderPath: string;
  basename: string;
  onClose: () => void;
  onUploadNew: () => void;
}

const typeIcons = {
  image: Image,
  audio: Music,
  video: Video,
  text: FileText,
  json: FileJson,
  other: Package,
};

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied to clipboard`);
}

export function AssetDetail({
  folderPath,
  basename,
  onClose,
  onUploadNew,
}: AssetDetailProps) {
  const asset = useQuery(api.cli.getAsset, { folderPath, basename });
  const versions = useQuery(api.cli.getAssetVersions, { folderPath, basename });
  const publishedFile = useQuery(api.cli.getPublishedFile, {
    folderPath,
    basename,
  });

  const publishDraft = useMutation(api.cli.publishDraft);
  const restoreVersion = useMutation(api.cli.restoreVersion);

  // Track which version is selected for preview (defaults to published)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  // Auto-select published version when it changes
  useEffect(() => {
    if (asset?.publishedVersionId && !selectedVersionId) {
      setSelectedVersionId(asset.publishedVersionId);
    }
  }, [asset?.publishedVersionId, selectedVersionId]);

  const isLoading = asset === undefined;

  // Get the selected version data
  const selectedVersion = versions?.find((v) => v._id === selectedVersionId);
  const previewUrl = selectedVersion?.storageId
    ? getVersionUrl({ versionId: selectedVersion._id, basename })
    : publishedFile?.url;
  const previewContentType = selectedVersion?.contentType || publishedFile?.contentType;

  const category = getContentTypeCategory(previewContentType);
  const Icon = typeIcons[category];

  const handlePublishDraft = async () => {
    try {
      await publishDraft({ folderPath, basename });
      toast.success("Draft published successfully");
    } catch (error) {
      toast.error("Failed to publish draft");
    }
  };

  const handleRestoreVersion = async (versionId: string, versionNumber: number) => {
    try {
      const result = await restoreVersion({
        versionId: versionId as Id<"assetManager:assetVersions">,
      });
      setSelectedVersionId(result.versionId);
      toast.success(`Restored version ${versionNumber} as version ${result.version}`);
    } catch (error) {
      toast.error("Failed to restore version");
    }
  };

  if (isLoading) {
    return (
      <div className="w-[400px] h-full bg-card border-l border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="w-[400px] h-full bg-card border-l border-border flex flex-col items-center justify-center p-8">
        <p className="text-muted-foreground">Asset not found</p>
        <Button variant="outline" onClick={onClose} className="mt-4">
          Close
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-[400px] h-full bg-card border-l border-border flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground truncate">
              {basename}
            </h2>
            <p className="text-xs text-muted-foreground font-mono truncate">
              {folderPath || "(root)"}/{basename}
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Preview */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-foreground">
                  Preview
                </h3>
                {selectedVersion && (
                  <Badge
                    variant={selectedVersion.state as any}
                    className="text-xs"
                  >
                    v{selectedVersion.version} ({selectedVersion.state})
                  </Badge>
                )}
              </div>
              <div className="rounded-lg overflow-hidden border border-border bg-surface-2">
                {category === "image" && previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={basename}
                    className="w-full h-auto max-h-64 object-contain"
                  />
                ) : category === "audio" && previewUrl ? (
                  <div className="p-4">
                    <audio
                      controls
                      className="w-full"
                      src={previewUrl}
                      key={previewUrl}
                    />
                  </div>
                ) : category === "video" && previewUrl ? (
                  <video
                    controls
                    className="w-full max-h-64"
                    src={previewUrl}
                    key={previewUrl}
                  />
                ) : (
                  <div className="aspect-video flex items-center justify-center">
                    <Icon className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">
                Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <Badge variant={category as any} className="capitalize">
                    {publishedFile?.contentType || "Unknown"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size</span>
                  <span>
                    {publishedFile?.size
                      ? formatBytes(publishedFile.size)
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Versions</span>
                  <span>{asset.versionCounter}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {publishedFile ? (
                    <Badge variant="published">Published</Badge>
                  ) : versions && versions.some((v: { state: string }) => v.state === "draft") ? (
                    <Badge variant="draft">Has Draft</Badge>
                  ) : (
                    <Badge variant="muted">No versions</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={onUploadNew}>
                <Upload className="h-4 w-4 mr-2" />
                Upload New
              </Button>
              {publishedFile?.url && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        copyToClipboard(publishedFile.url!, "Published URL")
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy Published URL</TooltipContent>
                </Tooltip>
              )}
              {publishedFile?.url && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" asChild>
                      <a
                        href={publishedFile.url}
                        download={basename}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Version History */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">
                Version History
              </h3>
              {versions === undefined ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : versions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No versions yet. Upload a file to create the first version.
                </p>
              ) : (
                <div className="space-y-2">
                  {[...versions].reverse().map((version) => {
                    const versionUrl =
                      version.storageId &&
                      getVersionUrl({
                        versionId: version._id,
                        basename,
                      });
                    const isSelected = selectedVersionId === version._id;

                    return (
                      <button
                        key={version._id}
                        onClick={() => setSelectedVersionId(version._id)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-all",
                          isSelected
                            ? "ring-2 ring-primary ring-offset-1"
                            : "hover:border-primary/50",
                          version.state === "published"
                            ? "border-success/30 bg-success/5"
                            : version.state === "draft"
                              ? "border-warning/30 bg-warning/5"
                              : "border-border bg-surface-1"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {version.state === "published" ? (
                              <CheckCircle className="h-4 w-4 text-success" />
                            ) : version.state === "draft" ? (
                              <AlertCircle className="h-4 w-4 text-warning" />
                            ) : (
                              <Archive className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium text-sm">
                              Version {version.version}
                            </span>
                            <Badge
                              variant={version.state as any}
                              className="text-[10px]"
                            >
                              {version.state}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            {versionUrl && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(
                                        versionUrl,
                                        `Version ${version.version} URL`
                                      );
                                    }}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy Version URL</TooltipContent>
                              </Tooltip>
                            )}
                            {versionUrl && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="h-6 w-6"
                                    onClick={(e) => e.stopPropagation()}
                                    asChild
                                  >
                                    <a
                                      href={versionUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Open in New Tab</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground space-y-1">
                          {version.label && (
                            <p className="italic">"{version.label}"</p>
                          )}
                          <div className="flex items-center gap-3">
                            {version.size && (
                              <span>{formatBytes(version.size)}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(
                                new Date(version.createdAt),
                                { addSuffix: true }
                              )}
                            </span>
                          </div>
                        </div>
                        {version.state === "draft" && (
                          <Button
                            variant="success"
                            size="sm"
                            className="mt-2 w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePublishDraft();
                            }}
                          >
                            Publish This Version
                          </Button>
                        )}
                        {version.state === "archived" && version.storageId && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestoreVersion(version._id, version.version);
                            }}
                          >
                            <RotateCcw className="h-3 w-3 mr-2" />
                            Restore This Version
                          </Button>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}
