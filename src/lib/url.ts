/** Prefix an internal path with the configured base so links survive a project-subpath deploy. */
export function url(path = '/'): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}` || '/';
}
