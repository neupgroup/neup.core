/*
::neup.documentation::core-slug-helper

::public

Normalizes free-form text into URL-safe slugs.

Returns a lowercase kebab-case string and falls back to a caller-provided value
when the input cannot produce a usable slug.

::public end
::end
*/

export function slugify(value: string, fallback = 'item') {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || fallback;
}
