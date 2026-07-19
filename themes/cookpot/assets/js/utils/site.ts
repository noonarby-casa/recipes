/**
 * Returns the site base path prefix, accounting for subdirectory deployments.
 * Returns '/recipes/' when deployed under that path, otherwise '/'.
 */
export function getSiteBasePath(): string {
  return window.location.pathname.startsWith('/recipes/') ? '/recipes/' : '/';
}
