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

export function resolveAppBrowserPath(path: string) {
  if (!path.startsWith("/")) {
    throw new Error("Application paths must start with '/'.");
  }

  if (!appBasePath) {
    return path;
  }

  return path === appBasePath || path.startsWith(`${appBasePath}/`)
    ? path
    : withAppBasePath(path);
}
