#!/usr/bin/env bash

set -Eeuo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

node - "$SCRIPT_DIR" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');

const coreDir = process.argv[2];
const configPath = path.resolve(coreDir, '../../base/application.json');

try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const features = config.features ?? {};
  const database = features.database;
  if (typeof features !== 'object' || features === null || Array.isArray(features)) {
    throw new Error('features must be an object');
  }
  if (database !== undefined &&
      (typeof database !== 'object' || database === null || Array.isArray(database))) {
    throw new Error('features.database must be an object');
  }
  if (database?.isRequired !== undefined && typeof database.isRequired !== 'boolean') {
    throw new Error('features.database.isRequired must be a boolean');
  }
  if (database?.type !== undefined &&
      (typeof database.type !== 'string' || !database.type.trim())) {
    throw new Error('features.database.type must be a nonempty string');
  }
  if (features.intelligence !== undefined && typeof features.intelligence !== 'boolean') {
    throw new Error('features.intelligence must be a boolean');
  }

  const remove = (relativePath) => {
    const target = path.join(coreDir, relativePath);
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
      console.log(`Removed core/${relativePath}`);
    }
  };

  if (database?.isRequired === false) {
    remove('database');
  } else if (database?.type && database.type.trim().toLowerCase() !== 'prisma') {
    remove('database/prisma.ts');
    // The current entry point only re-exports the Prisma adapter.
    remove('database/index.ts');
  }

  if (features.intelligence === false) {
    remove('intelligence');
  }
} catch (error) {
  console.error(`Unable to optimize Core using ${configPath}: ${error.message}`);
  process.exitCode = 1;
}
NODE
