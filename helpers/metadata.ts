import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { prisma as db } from '@/core/database/prisma';

/*
::neup.documentation::core-helper-metadata
::title Metadata Helper

Shared metadata helpers for formatting page titles.

::public

Use `generatePageMetadata()` in Next.js pages that need a title formatted with the active asset name.

Use `createPageMetadata()` when the caller already has every title segment.

::public end

::private

`generatePageMetadata()` reads the `assetId` cookie and fetches the asset name through the core Prisma client so core metadata does not import application services.

::private end

::end
*/

export const APP_NAME = 'NeupID';

function compact(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
}

export function formatAppTitle(...parts: Array<string | null | undefined>) {
  const titleParts = compact(parts);
  titleParts.push(APP_NAME);
  return titleParts.join(', ');
}

export function createPageMetadata(
  ...parts: Array<string | null | undefined>
): Metadata {
  return {
    title: formatAppTitle(...parts),
  };
}

export async function generatePageMetadata(pageTitle: string): Promise<Metadata> {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;

  if (!assetId) {
    return createPageMetadata(pageTitle, 'Asset');
  }

  const asset = await db.asset.findUnique({
    where: { id: assetId },
    select: { name: true },
  });

  return createPageMetadata(pageTitle, asset?.name || 'Asset');
}
