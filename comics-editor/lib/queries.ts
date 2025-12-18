import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";

// Reusable query options for admin panel
export const queries = {
  folders: (parentPath?: string) => convexQuery(api.cli.listFolders, { parentPath }),
  assets: (folderPath: string) => convexQuery(api.cli.listAssets, { folderPath }),
  publishedFilesInFolder: (folderPath: string) =>
    convexQuery(api.cli.listPublishedFilesInFolder, { folderPath }),
  asset: (folderPath: string, basename: string) =>
    convexQuery(api.cli.getAsset, { folderPath, basename }),
  assetVersions: (folderPath: string, basename: string) =>
    convexQuery(api.cli.getAssetVersions, { folderPath, basename }),
  publishedFile: (folderPath: string, basename: string) =>
    convexQuery(api.cli.getPublishedFile, { folderPath, basename }),

  // Comic editor queries
  characters: () => convexQuery(api.comics.listCharacters, {}),
  character: (characterKey: string) =>
    convexQuery(api.comics.getCharacter, { characterKey }),
  scenarios: () => convexQuery(api.comics.listScenarios, {}),
  scenario: (scenarioName: string) =>
    convexQuery(api.comics.getScenario, { scenarioName }),
  scenarioOrder: () => convexQuery(api.comics.getScenarioOrder, {}),
  generatedStrips: (scenarioName?: string) =>
    convexQuery(api.comics.listGeneratedStrips, { scenarioName }),
  stripVersions: (scenarioName: string, basename?: string) =>
    convexQuery(api.comics.getStripVersions, { scenarioName, basename }),

  // Story queries
  stories: () => convexQuery(api.comics.listStories, {}),
  story: (slug: string) => convexQuery(api.comics.getStory, { slug }),

  // Story-scoped queries
  storyScenarios: (storySlug: string) =>
    convexQuery(api.comics.listStoryScenarios, { storySlug }),
  storyScenario: (storySlug: string, scenarioName: string) =>
    convexQuery(api.comics.getStoryScenario, { storySlug, scenarioName }),
  storyScenarioOrder: (storySlug: string) =>
    convexQuery(api.comics.getStoryScenarioOrder, { storySlug }),
  storyStrips: (storySlug: string, scenarioName?: string) =>
    convexQuery(api.comics.listStoryStrips, { storySlug, scenarioName }),
};
