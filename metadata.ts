/*
::neup.documentation::core-metadata-module
::title Core Metadata Module

Canonical metadata helpers for formatting reusable page metadata.

::public

Import `generatePageMetadata()` from this module when building route metadata.

The helper is generic and accepts a page-provided `title` plus optional
`prefix`, `suffix`, `titleKind`, `separator`, `prefixSeparator`,
`suffixSeparator`, and `description`.

::public end

::private

This module intentionally avoids Prisma, cookies, or other request-bound
dependencies so it remains safe to import from route metadata code.

::private end

::end
*/

import type { Metadata } from 'next';

export const DEFAULT_META_DESCRIPTION = 'Visually build your website.';
export const DEFAULT_TITLE_SEPARATOR = ', ';

export type MetadataTitleKind =
  | 'title'
  | 'prefix-title'
  | 'title-suffix'
  | 'prefix-title-suffix';

type TitlePart = string | null | undefined;

export type PageMetadataInput = {
  title?: TitlePart;
  prefix?: TitlePart;
  suffix?: TitlePart;
  titleKind?: MetadataTitleKind;
  separator?: string;
  prefixSeparator?: string;
  suffixSeparator?: string;
  description?: string | null;
};

function normalizeTitlePart(value: TitlePart) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function formatMetadataTitle(input: PageMetadataInput) {
  const title = normalizeTitlePart(input.title);
  const prefix = normalizeTitlePart(input.prefix);
  const suffix = normalizeTitlePart(input.suffix);
  const titleKind = input.titleKind ?? 'title';
  const separator = input.separator ?? DEFAULT_TITLE_SEPARATOR;
  const prefixSeparator = input.prefixSeparator ?? separator;
  const suffixSeparator = input.suffixSeparator ?? separator;

  if (titleKind === 'prefix-title-suffix') {
    return [prefix, title, suffix].filter(Boolean).join(separator);
  }

  if (titleKind === 'prefix-title') {
    return [prefix, title].filter(Boolean).join(prefixSeparator);
  }

  if (titleKind === 'title-suffix') {
    return [title, suffix].filter(Boolean).join(suffixSeparator);
  }

  return title ?? prefix ?? suffix ?? '';
}

export function generatePageMetadata(input: PageMetadataInput): Metadata {
  const formattedTitle = formatMetadataTitle(input);

  return {
    title: formattedTitle || undefined,
    description: input.description?.trim() || DEFAULT_META_DESCRIPTION,
  };
}

export function formMetadata(input: {
  title: string;
  meta_desc?: string | null;
}): Metadata {
  return generatePageMetadata({
    title: input.title,
    description: input.meta_desc,
  });
}
