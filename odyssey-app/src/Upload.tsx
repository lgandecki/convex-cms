import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function UploadAssetForm({ folderPath }: { folderPath: string }) {
  const generateUploadUrl = useMutation(
    api.generateUploadUrl.generateUploadUrl,
  );
  const commitUpload = useMutation(api.generateUploadUrl.commitUpload);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1) Get upload URL from Convex
    const uploadUrl = await generateUploadUrl();

    // 2) POST the file to that URL
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!res.ok) {
      console.error("Upload failed", await res.text());
      return;
    }

    const { storageId } = await res.json();

    // 3) Tell your asset manager about this upload
    await commitUpload({
      folderPath,
      basename: file.name, // or ask user for nicer basename
      storageId,
      publish: true, // or false for draft-only
      label: "Uploaded from admin panel",
    });

    // 4) Refresh whatever query lists assets in this folder
    // (Convex hooks will re-run automatically if you’re using useQuery)
  }

  return (
    <label>
      Upload file
      <input type="file" onChange={onChange} />
    </label>
  );
}
