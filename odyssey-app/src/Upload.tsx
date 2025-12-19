import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function UploadAssetForm({ folderPath }: { folderPath: string }) {
  const startUpload = useMutation(api.generateUploadUrl.startUpload);
  const finishUpload = useMutation(api.generateUploadUrl.finishUpload);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1) Start upload to get intentId, uploadUrl, and backend type
    const { intentId, uploadUrl, backend } = await startUpload({
      folderPath,
      basename: file.name,
      publish: true,
      label: "Uploaded from admin panel",
    });

    // 2) Upload file - method differs by backend (R2 uses PUT, Convex uses POST)
    const res = await fetch(uploadUrl, {
      method: backend === "r2" ? "PUT" : "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!res.ok) {
      console.error("Upload failed", await res.text());
      return;
    }

    // 3) Parse response - Convex returns JSON with storageId, R2 returns empty
    const uploadResponse = backend === "convex" ? await res.json() : undefined;

    // 4) Finish the upload with file metadata
    await finishUpload({
      intentId,
      uploadResponse,
      size: file.size,
      contentType: file.type,
    });

    // 5) Convex hooks will re-run automatically
  }

  return (
    <label>
      Upload file
      <input type="file" onChange={onChange} />
    </label>
  );
}
