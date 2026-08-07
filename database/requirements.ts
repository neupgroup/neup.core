/*
::neup.documentation::core-database-requirements
::title Core Database Requirements

Validates the minimum local environment requirements needed before the shared Prisma client is created.

::public

Import `ensureDatabaseRequirements` from `@/core/database/requirements` to verify that `.env` exists and that required database environment variables are present.

::public end

::private

The guard throws synchronously during module initialization so database-backed routes and services fail fast when configuration is missing.

::private end

::end
*/

import { existsSync } from 'node:fs'
import path from 'node:path'

const REQUIRED_DATABASE_ENV_VARS = ['DATABASE_PROVIDER', 'DATABASE_URL'] as const

type RequiredDatabaseEnvVar = (typeof REQUIRED_DATABASE_ENV_VARS)[number]

function getMissingDatabaseEnvVars(): RequiredDatabaseEnvVar[] {
  return REQUIRED_DATABASE_ENV_VARS.filter((envVar) => {
    const value = process.env[envVar]
    return typeof value !== 'string' || value.trim().length === 0
  })
}

export function ensureDatabaseRequirements() {
  const envPath = path.join(process.cwd(), '.env')

  if (!existsSync(envPath)) {
    throw new Error(`Missing required environment file: ${envPath}`)
  }

  const missingEnvVars = getMissingDatabaseEnvVars()

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required database environment variables: ${missingEnvVars.join(', ')}`
    )
  }
}
