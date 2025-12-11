import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { registerAssetFsRoutes } from "./components/asset-manager/assetFsHttp";

const http = httpRouter();

auth.addHttpRoutes(http);
registerAssetFsRoutes(http);

export default http;
