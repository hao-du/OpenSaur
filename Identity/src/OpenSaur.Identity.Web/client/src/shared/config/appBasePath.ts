import { appEnvironment } from "./env";

export const appBasePath = appEnvironment.basePath === "/"
  ? ""
  : appEnvironment.basePath;

export function withAppBasePath(path: string) {
  if (!path.startsWith("/")) {
    throw new Error("Application paths must start with '/'.");
  }

  return `${appBasePath}${path}` || "/";
}
