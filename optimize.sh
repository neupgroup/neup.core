#!/usr/bin/env bash

set -Eeuo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

node - "$SCRIPT_DIR" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');

const coreDir = process.argv[2];
const baseDir = path.resolve(coreDir, '../../@base');
const modulesPath = path.join(baseDir, 'modules.json');
const featuresPath = path.join(baseDir, 'features.json');
const logicaDir = path.resolve(coreDir, '../logica');

try {
  const readJson = (file, fallback) => fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, 'utf8'))
    : fallback;
  const moduleList = readJson(modulesPath, []);
  const features = readJson(featuresPath, {});
  if (!Array.isArray(moduleList)) throw new Error('modules.json must contain an array');
  const modules = new Map(moduleList.map((module) => [module.name, module]));
  const database = features['native.database'] ?? modules.get('database');
  const databaseRequired = database?.isRequired === true;
  const account = modules.get('account');
  const accountSystem = typeof account?.accountSystem === 'string'
    ? account.accountSystem.trim().toLowerCase()
    : '';
  const remoteNeupId = accountSystem === 'neupid.remote';

  const remove = (relativePath) => {
    const target = path.join(coreDir, relativePath);
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
      console.log(`Removed core/${relativePath}`);
    }
  };

  if (!databaseRequired) {
    remove('database');
  } else if (database?.type && !['postgresql', 'postgres', 'prisma'].includes(database.type.trim().toLowerCase())) {
    remove('database/prisma.ts');
    remove('database/index.ts');
  }

  if (remoteNeupId) {
    const localAccountFile = path.join(logicaDir, 'account/self.ts');
    const accountIndexFile = path.join(logicaDir, 'account/index.ts');

    if (fs.existsSync(localAccountFile)) {
      fs.rmSync(localAccountFile, { force: true });
      console.log('Removed logica/account/self.ts for remote NeupID accounts');
    }

    if (fs.existsSync(accountIndexFile)) {
      const accountIndex = fs.readFileSync(accountIndexFile, 'utf8')
        .replace("import { self } from '@neup/logica/account/self';\n", '')
        .replace('account.self = self;\n', '');
      fs.writeFileSync(accountIndexFile, accountIndex);
      console.log('Removed local account self export for remote NeupID accounts');
    }
  }

  if (!modules.get('intelligence')?.isRequired && !features['native.intelligence']?.isRequired) {
    remove('intelligence');
  }
} catch (error) {
  console.error(`Unable to optimize Core using ${baseDir}: ${error.message}`);
  process.exitCode = 1;
}
NODE
