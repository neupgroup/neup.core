'use server';

import crypto from 'node:crypto';

export async function generateUuid(): Promise<string> {
  return crypto.randomUUID();
}
