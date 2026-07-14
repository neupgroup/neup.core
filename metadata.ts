/*
::neup.documentation::core-metadata-module
::title Core Metadata Module

Canonical metadata helpers for the account app.

::public

Import `formMetadata()` from this module when building route metadata.

The helper accepts a page `title` plus optional `meta_desc` text and returns a standard Next.js metadata object.

::public end

::private

This module intentionally avoids Prisma, cookies, or other request-bound dependencies so it remains safe to import from both route metadata code and client-adjacent title helpers.

::private end

::end
*/

import type { Metadata } from 'next';

export const APP_NAME = 'NeupID';
export const DEFAULT_META_DESCRIPTION = 'Create an account to access NeupID products and services.';

function compact(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
}

export function formatAppTitle(...parts: Array<string | null | undefined>) {
  const titleParts = compact(parts);
  if (!titleParts.length) {
    return APP_NAME;
  }

  return [...titleParts, APP_NAME].join(', ');
}

export function formMetadata(input: {
  title: string;
  meta_desc?: string | null;
}): Metadata {
  return {
    title: formatAppTitle(input.title),
    description: input.meta_desc?.trim() || DEFAULT_META_DESCRIPTION,
  };
}
