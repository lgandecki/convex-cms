/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as cli from "../cli.js";
import type * as generateUploadUrl from "../generateUploadUrl.js";
import type * as http from "../http.js";
import type * as kanban from "../kanban.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  cli: typeof cli;
  generateUploadUrl: typeof generateUploadUrl;
  http: typeof http;
  kanban: typeof kanban;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  assetManager: {
    assetFsHttp: {
      getBlobForServing: FunctionReference<
        "action",
        "internal",
        { storageId: string },
        null | ArrayBuffer
      >;
      getVersionForServing: FunctionReference<
        "query",
        "internal",
        { versionId: string },
        | null
        | {
            cacheControl?: string;
            contentType?: string;
            kind: "blob";
            storageId: string;
          }
        | { cacheControl?: string; kind: "redirect"; location: string }
      >;
    };
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
        { assetId: string; version: number; versionId: string }
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
        { assetId: string; version: number; versionId: string }
      >;
      createAsset: FunctionReference<
        "mutation",
        "internal",
        { basename: string; extra?: any; folderPath: string },
        string
      >;
      createFolderByName: FunctionReference<
        "mutation",
        "internal",
        { extra?: any; name: string; parentPath: string },
        string
      >;
      createFolderByPath: FunctionReference<
        "mutation",
        "internal",
        { extra?: any; name?: string; path: string },
        string
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
        }
      >;
      getAssetVersions: FunctionReference<
        "query",
        "internal",
        { basename: string; folderPath: string },
        any
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
        }
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
            draftVersionId?: string;
            extra?: any;
            folderPath: string;
            publishedVersionId?: string;
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
        }
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
        }
      >;
      getPublishedVersion: FunctionReference<
        "query",
        "internal",
        { basename: string; folderPath: string },
        any
      >;
      listAssetEvents: FunctionReference<
        "query",
        "internal",
        { basename: string; folderPath: string },
        Array<{
          createdAt: number;
          createdBy?: string;
          fromFolderPath?: string;
          toFolderPath?: string;
          type: string;
        }>
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
          draftVersionId?: string;
          extra?: any;
          folderPath: string;
          publishedVersionId?: string;
          updatedAt: number;
          updatedBy?: string;
          versionCounter: number;
        }>
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
        }>
      >;
      listPublishedAssetsInFolder: FunctionReference<
        "query",
        "internal",
        { folderPath: string },
        Array<{
          basename: string;
          createdAt: number;
          createdBy?: string;
          extra?: any;
          folderPath: string;
          label?: string;
          publishedAt?: number;
          publishedBy?: string;
          version: number;
        }>
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
        }>
      >;
      moveAsset: FunctionReference<
        "mutation",
        "internal",
        { basename: string; fromFolderPath: string; toFolderPath: string },
        { assetId: string; fromFolderPath: string; toFolderPath: string }
      >;
      publishDraft: FunctionReference<
        "mutation",
        "internal",
        { basename: string; folderPath: string },
        any
      >;
      updateFolder: FunctionReference<
        "mutation",
        "internal",
        { name?: string; newPath?: string; path: string },
        any
      >;
    };
    generateUploadUrl: {
      generateUploadUrl: FunctionReference<"mutation", "internal", {}, string>;
    };
  };
};
