/*
::neup.documentation::core-helper-prisma-compat
::title Core Helper Prisma Compatibility Export

Re-exports the canonical Prisma client module from the legacy helper path.

::public

Prefer importing Prisma from `@/core/database/prisma`.

This file remains as a compatibility bridge for older imports that have not yet been migrated.

::public end

::end
*/

export { prisma, default } from '@/core/database/prisma'
