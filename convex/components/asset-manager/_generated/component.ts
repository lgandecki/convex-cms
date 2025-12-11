/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    assetManager: {
      commitUpload: FunctionReference<
        "mutation",
        "internal",
        {
          basename: string;
          extra?: any;
          folderPath: string;
          label?: string;
          publish?: boolean;
          storageId: string;
        },
        { assetId: string; version: number; versionId: string },
        Name
      >;
      commitVersion: FunctionReference<
        "mutation",
        "internal",
        {
          basename: string;
          extra?: any;
          folderPath: string;
          label?: string;
          publish?: boolean;
        },
        { assetId: string; version: number; versionId: string },
        Name
      >;
      createAsset: FunctionReference<
        "mutation",
        "internal",
        { basename: string; extra?: any; folderPath: string },
        string,
        Name
      >;
      createFolderByName: FunctionReference<
        "mutation",
        "internal",
        { extra?: any; name: string; parentPath: string },
        string,
        Name
      >;
      createFolderByPath: FunctionReference<
        "mutation",
        "internal",
        { extra?: any; name?: string; path: string },
        string,
        Name
      >;
      getAsset: FunctionReference<
        "query",
        "internal",
        { basename: string; folderPath: string },
        null | {
          _creationTime: number;
          _id: string;
          basename: string;
          createdAt: number;
          createdBy?: string;
          extra?: any;
          folderPath: string;
          updatedAt: number;
          updatedBy?: string;
          versionCounter: number;
        },
        Name
      >;
      getAssetVersions: FunctionReference<
        "query",
        "internal",
        { basename: string; folderPath: string },
        any,
        Name
      >;
      getFolder: FunctionReference<
        "query",
        "internal",
        { path: string },
        null | {
          _creationTime: number;
          _id: string;
          createdAt: number;
          createdBy?: string;
          extra?: any;
          name: string;
          path: string;
          updatedAt: number;
          updatedBy?: string;
        },
        Name
      >;
      getFolderWithAssets: FunctionReference<
        "query",
        "internal",
        { path: string },
        null | {
          assets: Array<{
            _creationTime: number;
            _id: string;
            basename: string;
            createdAt: number;
            createdBy?: string;
            extra?: any;
            folderPath: string;
            updatedAt: number;
            updatedBy?: string;
            versionCounter: number;
          }>;
          folder: {
            _creationTime: number;
            _id: string;
            createdAt: number;
            createdBy?: string;
            extra?: any;
            name: string;
            path: string;
            updatedAt: number;
            updatedBy?: string;
          };
        },
        Name
      >;
      getPublishedFile: FunctionReference<
        "query",
        "internal",
        { basename: string; folderPath: string },
        null | {
          basename: string;
          contentType?: string;
          createdAt: number;
          createdBy?: string;
          folderPath: string;
          publishedAt: number;
          publishedBy?: string;
          sha256?: string;
          size?: number;
          state: "published";
          storageId: string;
          url: string;
          version: number;
        },
        Name
      >;
      getPublishedVersion: FunctionReference<
        "query",
        "internal",
        { basename: string; folderPath: string },
        any,
        Name
      >;
      listAssets: FunctionReference<
        "query",
        "internal",
        { folderPath: string },
        Array<{
          _creationTime: number;
          _id: string;
          basename: string;
          createdAt: number;
          createdBy?: string;
          extra?: any;
          folderPath: string;
          updatedAt: number;
          updatedBy?: string;
          versionCounter: number;
        }>,
        Name
      >;
      listFolders: FunctionReference<
        "query",
        "internal",
        { parentPath?: string },
        Array<{
          _creationTime: number;
          _id: string;
          createdAt: number;
          createdBy?: string;
          extra?: any;
          name: string;
          path: string;
          updatedAt: number;
          updatedBy?: string;
        }>,
        Name
      >;
      listPublishedFilesInFolder: FunctionReference<
        "query",
        "internal",
        { folderPath: string },
        Array<{
          basename: string;
          contentType?: string;
          folderPath: string;
          size?: number;
          storageId: string;
          url: string;
          version: number;
        }>,
        Name
      >;
      publishDraft: FunctionReference<
        "mutation",
        "internal",
        { basename: string; folderPath: string },
        any,
        Name
      >;
      updateFolder: FunctionReference<
        "mutation",
        "internal",
        { name?: string; newPath?: string; path: string },
        any,
        Name
      >;
    };
  };
