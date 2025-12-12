import { useState } from "react";
import { useQuery } from "convex/react";
import { useQuery as useTanstackQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import { queries } from "../../routes/admin";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Grid3X3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FolderTreeProps {
  selectedFolderPath: string;
  onFolderSelect: (path: string) => void;
  onCreateFolder: (parentPath: string) => void;
  onRenameFolder?: (path: string, currentName: string) => void;
}

interface FolderData {
  _id: string;
  path: string;
  name: string;
  _creationTime: number;
}

interface FolderItemProps {
  folder: FolderData;
  depth: number;
  selectedFolderPath: string;
  onFolderSelect: (path: string) => void;
  onCreateFolder: (parentPath: string) => void;
  onRenameFolder?: (path: string, currentName: string) => void;
}

function FolderItem({
  folder,
  depth,
  selectedFolderPath,
  onFolderSelect,
  onCreateFolder,
  onRenameFolder,
}: FolderItemProps) {
  const isSelected = selectedFolderPath === folder.path;
  // Auto-expand if this folder is an ancestor of the selected path
  const isAncestorOfSelected = selectedFolderPath.startsWith(folder.path + "/");
  const [userExpanded, setUserExpanded] = useState<boolean | null>(null);

  // Expanded if: user explicitly expanded, OR is ancestor of selected, OR is selected
  const isExpanded = userExpanded ?? (isAncestorOfSelected || isSelected);

  // Query for children when expanded
  const children = useQuery(
    api.cli.listFolders,
    isExpanded ? { parentPath: folder.path } : "skip"
  );

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUserExpanded(!isExpanded);
  };

  const handleFolderClick = () => {
    onFolderSelect(folder.path);
  };

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            onClick={handleFolderClick}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors",
              isSelected
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
          >
            <span
              onClick={handleChevronClick}
              className="cursor-pointer hover:bg-accent rounded p-0.5 -m-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 shrink-0" />
              ) : (
                <ChevronRight className="h-3 w-3 shrink-0" />
              )}
            </span>
            {isSelected ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Folder className="h-4 w-4 shrink-0" />
            )}
            <span className="truncate">{folder.name}</span>
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onCreateFolder(folder.path)}>
            <Plus className="h-4 w-4 mr-2" />
            New Subfolder
          </ContextMenuItem>
          {onRenameFolder && (
            <ContextMenuItem
              onClick={() => onRenameFolder(folder.path, folder.name)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Rename
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem className="text-destructive" disabled>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {isExpanded && children && children.length > 0 && (
        <div className="animate-fade-in">
          {children.map((child: FolderData) => (
            <FolderItem
              key={child._id}
              folder={child}
              depth={depth + 1}
              selectedFolderPath={selectedFolderPath}
              onFolderSelect={onFolderSelect}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree({
  selectedFolderPath,
  onFolderSelect,
  onCreateFolder,
  onRenameFolder,
}: FolderTreeProps) {
  // Query root folders - non-suspense so SSR renders instantly with loading state
  const { data: rootFolders, isLoading } = useTanstackQuery(queries.folders(""));

  if (isLoading || !rootFolders) {
    return <FolderTreeSkeleton />;
  }

  return (
    <aside className="w-60 h-full bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      {/* Quick Filters */}
      <div className="p-3 border-b border-sidebar-border">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">
          Quick Filters
        </p>
        <div className="space-y-0.5">
          <button
            onClick={() => onFolderSelect("")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-1.5 text-sm rounded-md transition-colors",
              selectedFolderPath === ""
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Grid3X3 className="h-4 w-4" />
            <span>All Assets (Root)</span>
          </button>
        </div>
      </div>

      {/* Folder Tree */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2 px-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Folders
              </p>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-6 w-6"
                onClick={() => onCreateFolder("")}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            {rootFolders.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-2">
                No folders yet. Click + to create one.
              </p>
            ) : (
              <div className="space-y-0.5">
                {rootFolders.map((folder) => (
                  <FolderItem
                    key={folder._id}
                    folder={folder}
                    depth={0}
                    selectedFolderPath={selectedFolderPath}
                    onFolderSelect={onFolderSelect}
                    onCreateFolder={onCreateFolder}
                    onRenameFolder={onRenameFolder}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}

// Skeleton shown during direct navigation (before data loads)
export function FolderTreeSkeleton() {
  return (
    <aside className="w-60 h-full bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      <div className="p-3 border-b border-sidebar-border">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">
          Quick Filters
        </p>
        <div className="space-y-0.5">
          <div className="w-full flex items-center gap-3 px-3 py-1.5">
            <div className="h-4 w-4 rounded bg-muted animate-pulse" />
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
      <div className="flex-1 p-3">
        <div className="flex items-center justify-between mb-2 px-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Folders
          </p>
        </div>
        <div className="space-y-2 px-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-muted animate-pulse" />
              <div className="h-4 w-4 rounded bg-muted animate-pulse" />
              <div className="h-4 flex-1 rounded bg-muted animate-pulse" style={{ maxWidth: `${60 + i * 10}%` }} />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
