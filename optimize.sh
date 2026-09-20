#!/usr/bin/env bash

set -Eeuo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

node - "$SCRIPT_DIR" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');

const coreDir = process.argv[2];
const configPath = path.resolve(coreDir, '../../@base/application.json');

try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (!Array.isArray(config.modules)) throw new Error('modules must be an array');
  const modules = new Map(config.modules.map((module) => [module.name, module]));
  const database = modules.get('database');
  const databaseRequired = database?.isRequired === true;

  const remove = (relativePath) => {
    const target = path.join(coreDir, relativePath);
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
      console.log(`Removed core/${relativePath}`);
    }
  };

  if (!databaseRequired) {
    remove('database');
  } else if (database?.type && database.type.trim().toLowerCase() !== 'prisma') {
    remove('database/prisma.ts');
    // The current entry point only re-exports the Prisma adapter.
    remove('database/index.ts');
  }

  if (!modules.get('intelligence')?.isRequired) {
    remove('intelligence');
  }
} catch (error) {
  console.error(`Unable to optimize Core using ${configPath}: ${error.message}`);
  process.exitCode = 1;
}
NODE
