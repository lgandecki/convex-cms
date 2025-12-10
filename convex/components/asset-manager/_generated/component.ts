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
      getFolder: FunctionReference<
        "query",
        "internal",
        { path: string },
        null | {
          _id: string;
          createdAt: number;
          extra?: any;
          name: string;
          path: string;
          updatedAt: number;
        },
        Name
      >;
      listFolders: FunctionReference<
        "query",
        "internal",
        { parentPath?: string },
        Array<{
          _id: string;
          createdAt: number;
          extra?: any;
          name: string;
          path: string;
          updatedAt: number;
        }>,
        Name
      >;
    };
  };
