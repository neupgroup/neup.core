/*
::neup.documentation::core-database-prisma
::title Core Database Prisma Client

Provides the shared Prisma client instance for server-side services and routes.

::public

Import `prisma` from `@/core/database/prisma` whenever application code needs database access.

The module exports both a named `prisma` binding and a default export for compatibility with existing call sites.

::public end

::private

The client uses `pg` with `@prisma/adapter-pg`, and caches the Prisma client on `globalThis` in development to avoid creating duplicate pools during hot reloads.

The delegate guard rebuilds the cached client when the generated Prisma client shape changes after schema updates.

::private end

::end
*/

import { PrismaPg } from '@prisma/adapter-pg'
// Keep @prisma/adapter-pg aligned with prisma and @prisma/client.
import { ensureDatabaseRequirements } from '@/core/database/requirements'
// Import the generated Prisma client from the project-local alias
// If getting error, create index.ts in prisma/client and use this code in the index.ts
// export * from './client'
import { PrismaClient } from '@/prisma/client'
export { Prisma } from '@/prisma/client'
export type * from '@/prisma/client'

ensureDatabaseRequirements()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required.')
}

const adapter = new PrismaPg(connectionString)

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

declare global {
  var prisma: PrismaClientSingleton
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
