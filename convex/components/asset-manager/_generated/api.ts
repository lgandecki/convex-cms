/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _testInsertFakeFile from "../_testInsertFakeFile.js";
import type * as allocateFolderSegment from "../allocateFolderSegment.js";
import type * as assetFsHttp from "../assetFsHttp.js";
import type * as assetManager from "../assetManager.js";
import type * as authAdapter from "../authAdapter.js";
import type * as generateUploadUrl from "../generateUploadUrl.js";
import type * as helpers_parseVersionIdFromPath from "../helpers/parseVersionIdFromPath.js";
import type * as registerAssetFsRoutes from "../registerAssetFsRoutes.js";
import type * as slugify from "../slugify.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import { anyApi, componentsGeneric } from "convex/server";

const fullApi: ApiFromModules<{
  _testInsertFakeFile: typeof _testInsertFakeFile;
  allocateFolderSegment: typeof allocateFolderSegment;
  assetFsHttp: typeof assetFsHttp;
  assetManager: typeof assetManager;
  authAdapter: typeof authAdapter;
  generateUploadUrl: typeof generateUploadUrl;
  "helpers/parseVersionIdFromPath": typeof helpers_parseVersionIdFromPath;
  registerAssetFsRoutes: typeof registerAssetFsRoutes;
  slugify: typeof slugify;
}> = anyApi as any;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
> = anyApi as any;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
> = anyApi as any;

export const components = componentsGeneric() as unknown as {};
