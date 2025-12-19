import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Upload a file to the asset manager using the intent-based flow.
 * Handles both Convex and R2 backends transparently.
 */
export async function uploadFileToAssetManager(
  file: File,
  startUpload: (args: {
    folderPath: string;
    basename: string;
    publish?: boolean;
    label?: string;
  }) => Promise<{
    intentId: string;
    backend: "convex" | "r2";
    uploadUrl: string;
  }>,
  finishUpload: (args: {
    intentId: string;
    uploadResponse?: unknown;
    size?: number;
    contentType?: string;
  }) => Promise<{
    assetId: string;
    versionId: string;
    version: number;
  }>,
  options: {
    folderPath: string;
    basename?: string;
    publish?: boolean;
    label?: string;
  }
): Promise<{ assetId: string; versionId: string; version: number }> {
  const basename = options.basename ?? file.name;

  // 1. Start upload to get intentId, uploadUrl, and backend type
  const { intentId, uploadUrl, backend } = await startUpload({
    folderPath: options.folderPath,
    basename,
    publish: options.publish,
    label: options.label,
  });

  // 2. Upload file - method differs by backend (R2 uses PUT, Convex uses POST)
  const res = await fetch(uploadUrl, {
    method: backend === "r2" ? "PUT" : "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
  }

  // 3. Parse response - Convex returns JSON with storageId, R2 returns empty
  const uploadResponse = backend === "convex" ? await res.json() : undefined;

  // 4. Finish the upload with file metadata
  return finishUpload({
    intentId,
    uploadResponse,
    size: file.size,
    contentType: file.type,
  });
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getContentTypeCategory(
  contentType: string | undefined
): "image" | "audio" | "video" | "text" | "json" | "other" {
  if (!contentType) return "other";
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("audio/")) return "audio";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("text/")) return "text";
  if (contentType === "application/json") return "json";
  return "other";
}
