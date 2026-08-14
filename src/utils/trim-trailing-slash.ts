/**
 * Drop trailing slashes so a host option can be written with or without one.
 *
 * @param {string} url - url to clean up.
 *
 * @returns {string}
 */
export default function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}
