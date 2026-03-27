export const publicAuthRoutes = [
  "/login",
  "/auth/callback"
] as const;

export function isPublicAuthRoute(pathname: string) {
  return publicAuthRoutes.includes(pathname as (typeof publicAuthRoutes)[number]);
}
