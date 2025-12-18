import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

export async function fetchOdysseyAudioFiles() {
  const convexUrl =
    process.env.VITE_CONVEX_URL || import.meta.env.VITE_CONVEX_URL;

  if (!convexUrl) {
    throw new Error("VITE_CONVEX_URL environment variable is required");
  }

  const client = new ConvexHttpClient(convexUrl);

  const odysseyMusicFiles = await client.query(
    api.cli.listPublishedFilesInFolder,
    {
      folderPath: "odyssey-music",
    },
  );

  return { odysseyMusicFiles };
}
