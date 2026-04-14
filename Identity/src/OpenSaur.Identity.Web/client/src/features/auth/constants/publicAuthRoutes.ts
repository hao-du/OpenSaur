export const publicAuthRoutes = [
  "/auth-required"
] as const;

export function isPublicAuthRoute(pathname: string) {
  return publicAuthRoutes.includes(pathname as (typeof publicAuthRoutes)[number]);
}
