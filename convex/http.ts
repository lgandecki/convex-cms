import { httpRouter } from "convex/server";
import { auth } from "./auth";

import type { HttpRouter } from "convex/server";
import { components, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { httpAction } from "./_generated/server";
import { parseVersionIdFromPath } from "./components/asset-manager/helpers/parseVersionIdFromPath";
import { registerAssetFsRoutes } from "./components/asset-manager/registerAssetFsRoutes";
const http = httpRouter();

auth.addHttpRoutes(http);
registerAssetFsRoutes(http);

export default http;
