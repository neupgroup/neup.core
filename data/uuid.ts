/*
::neup.documentation::core-data-uuid
::title UUID Helpers

Provides shared string UUID helpers for data records.

::public

Use `stringUuid()` when a plain UUID string is needed.

Use `timedStringUuid()` when a sortable-ish timestamp prefix should be included before the UUID.

::public end

::private

These helpers wrap Node's `randomUUID()` so application and service code do not import crypto directly for record IDs.

::private end

::end
*/

import { randomUUID } from 'node:crypto';

export function stringUuid(): string {
  return randomUUID();
}

export function timedStringUuid(): string {
  return `${Date.now()}${stringUuid()}`;
}
