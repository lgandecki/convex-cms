// convex/comicGeneration.ts
import { v } from "convex/values";
import { mutation, internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Type definitions
interface CharacterMetadata {
  name: string;
  organism: string;
  power: string;
  archetype: string;
  bio: string;
}

interface Frame {
  scene: string;
  characters: string[];
  speaker: string;
  dialogue: string;
  imageType: "comic" | "superhero";
}

interface Scenario {
  name: string;
  description: string;
  characterImages: Record<string, "comic" | "superhero" | "both">;
  frames: Frame[];
}

// Start generation - creates submission and schedules the action
export const startGeneration = mutation({
  args: {
    scenarioPath: v.string(),
  },
  handler: async (ctx, args) => {
    // Create submission record
    const submissionId = await ctx.db.insert("comicSubmissions", {
      scenarioPath: args.scenarioPath,
      status: "pending",
      progress: 0,
      progressMessage: "Queued for generation",
      createdAt: Date.now(),
    });

    // Schedule the generation action
    await ctx.scheduler.runAfter(
      0,
      internal.comicGeneration.generateComicStrip,
      {
        submissionId,
        scenarioPath: args.scenarioPath,
      },
    );

    return submissionId;
  },
});

// Internal action that performs the actual generation
export const generateComicStrip = internalAction({
  args: {
    submissionId: v.id("comicSubmissions"),
    scenarioPath: v.string(),
  },
  handler: async (ctx, args) => {
    const { submissionId, scenarioPath } = args;

    try {
      // Update status to processing
      await ctx.runMutation(internal.comicSubmissions.updateProgress, {
        id: submissionId,
        progress: 5,
        progressMessage: "Loading scenario...",
      });

      // Load the scenario from asset manager
      const scenarioAssets = await ctx.runQuery(api.comics.listScenarios, {});

      const scenarioName = scenarioPath
        .replace("comics/scenarios/", "")
        .replace(".json", "");
      const scenarioData = scenarioAssets.find((s) => s.name === scenarioName);

      if (!scenarioData?.scenario) {
        throw new Error(`Scenario not found: ${scenarioPath}`);
      }

      const scenario = scenarioData.scenario;

      await ctx.runMutation(internal.comicSubmissions.updateProgress, {
        id: submissionId,
        progress: 15,
        progressMessage: "Loading characters...",
      });

      // Load characters
      const characters = await ctx.runQuery(api.comics.listCharacters, {});
      const characterMap = new Map(characters.map((c) => [c.key, c]));

      await ctx.runMutation(internal.comicSubmissions.updateProgress, {
        id: submissionId,
        progress: 25,
        progressMessage: "Building prompt...",
      });

      // Build the prompt parts
      const parts: Array<{
        text?: string;
        inlineData?: { data: string; mimeType: string };
      }> = [];

      // Add character references with images
      for (const [charKey, imageType] of Object.entries(
        scenario.characterImages,
      )) {
        const character = characterMap.get(charKey);
        if (!character) {
          console.warn(`Character not found: ${charKey}`);
          continue;
        }

        const metadata = character.metadata;
        const loadComic = imageType === "comic" || imageType === "both";
        const loadSuperhero = imageType === "superhero" || imageType === "both";

        // Add comic version
        if (loadComic && character.comicImageUrl) {
          const imageData = await fetchImageAsBase64(character.comicImageUrl);
          if (imageData) {
            parts.push({
              text: `Reference character: ${metadata?.name ?? charKey} (comic version)\n`,
            });
            parts.push({ inlineData: imageData });
          }
        }

        // Add superhero version
        if (loadSuperhero && character.superheroImageUrl) {
          const imageData = await fetchImageAsBase64(
            character.superheroImageUrl,
          );
          if (imageData) {
            parts.push({
              text: `Reference character: ${metadata?.name ?? charKey} (superhero version)`,
            });
            parts.push({ inlineData: imageData });
          }
        }
      }

      await ctx.runMutation(internal.comicSubmissions.updateProgress, {
        id: submissionId,
        progress: 40,
        progressMessage: "Preparing frames...",
      });

      // Add instructions
      parts.push({
        text: `\nUse the reference characters above exactly for consistency (match faces, clothing, poses, and styles precisely to their references).\nStrictly match the reference images for all characters—do not deviate from their appearances.\n\nGenerate a complete ${scenario.frames.length}-panel vertical comic strip (9:16 aspect ratio) with clean panel borders, speech bubbles, and dynamic layout.\n\n`,
      });

      // Add frames description
      const framesText = buildFramesText(scenario, characterMap);
      parts.push({ text: framesText });

      await ctx.runMutation(internal.comicSubmissions.updateProgress, {
        id: submissionId,
        progress: 50,
        progressMessage: "Calling Gemini API...",
      });

      // Call Gemini API
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable not set");
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts,
              },
            ],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"],
              imageConfig: {
                aspectRatio: "9:16",
                imageSize: "2K",
              },
            },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      await ctx.runMutation(internal.comicSubmissions.updateProgress, {
        id: submissionId,
        progress: 80,
        progressMessage: "Processing response...",
      });

      const result = await response.json();

      // Find the image in the response
      let imageData: { data: string; mimeType: string } | null = null;

      if (result.candidates?.[0]?.content?.parts) {
        for (const part of result.candidates[0].content.parts) {
          if (part.inlineData) {
            imageData = {
              data: part.inlineData.data,
              mimeType: part.inlineData.mimeType || "image/png",
            };
            break;
          }
        }
      }

      if (!imageData) {
        throw new Error("No image generated in response");
      }

      await ctx.runMutation(internal.comicSubmissions.updateProgress, {
        id: submissionId,
        progress: 90,
        progressMessage: "Saving result...",
      });

      // Convert base64 to blob and upload to Convex storage
      const binaryData = Uint8Array.from(atob(imageData.data), (c) =>
        c.charCodeAt(0),
      );
      const blob = new Blob([binaryData], { type: imageData.mimeType });

      const storageId = await ctx.storage.store(blob);

      // Mark submission as complete
      await ctx.runMutation(internal.comicSubmissions.complete, {
        id: submissionId,
        resultStorageId: storageId,
      });

      // TODO: Asset manager integration for versioning
      // The asset manager component expects storageIds from its own upload flow,
      // not from ctx.storage.store(). Would need to use generateUploadUrl pattern.
    } catch (error) {
      console.error("Generation failed:", error);
      await ctx.runMutation(internal.comicSubmissions.fail, {
        id: submissionId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});

// Helper function to convert ArrayBuffer to base64 without stack overflow
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000; // 32KB chunks to avoid stack overflow
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

// Helper function to fetch image and convert to base64
async function fetchImageAsBase64(
  url: string,
): Promise<{ data: string; mimeType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch image: ${url}`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const arrayBuffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);

    return {
      data: base64,
      mimeType: contentType,
    };
  } catch (error) {
    console.warn(`Error fetching image ${url}:`, error);
    return null;
  }
}

// Helper function to build frames text for the prompt
function buildFramesText(
  scenario: Scenario,
  characterMap: Map<string, { metadata: CharacterMetadata | null }>,
): string {
  return scenario.frames
    .map((frame, i) => {
      const character = characterMap.get(
        frame.speaker.replace("-superhero", ""),
      );
      const speakerName = character?.metadata?.name || frame.speaker;
      const imageTypeLabel =
        frame.imageType === "superhero" ? " (superhero version)" : "";

      return `### Frame ${i + 1}
- **Scene**: ${frame.scene}
- **Characters present**: ${frame.characters.join(", ")}
- **Speaker**: ${speakerName}${imageTypeLabel}
- **Dialogue**: "${frame.dialogue}"
- **Use image type**: ${frame.imageType}`;
    })
    .join("\n\n");
}
