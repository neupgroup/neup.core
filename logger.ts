/*
::neup.documentation::core-logger-module
::title Core Logger

Shared console logger helpers.

::public

Use `logger()` for normal logs, `devLogger()` for development-only logs, and
`productionLogger()` for production-only logs.

::public end

::private

These helpers only wrap console output. They do not persist logs or import
application, service, component, or Logica modules.

::private end

::end
*/

import { getEnvVariable } from '@/core/helpers/env';

export type LoggerMode = 'always' | 'development' | 'production';

export type LoggerMethod = 'debug' | 'error' | 'info' | 'log' | 'warn';

export type LoggerOptions = {
  mode?: LoggerMode;
  method?: LoggerMethod;
};

function shouldLog(mode: LoggerMode): boolean {
  if (mode === 'always') return true;
  return getEnvVariable('NODE_ENV') === mode;
}

function writeLog(options: LoggerOptions, values: unknown[]): void {
  const mode = options.mode ?? 'always';
  if (!shouldLog(mode)) return;

  const method = options.method ?? 'log';
  console[method](...values);
}

export function logger(...values: unknown[]): void;
export function logger(options: LoggerOptions, ...values: unknown[]): void;
export function logger(
  firstValueOrOptions?: LoggerOptions | unknown,
  ...values: unknown[]
): void {
  const hasOptions =
    typeof firstValueOrOptions === 'object' &&
    firstValueOrOptions !== null &&
    ('mode' in firstValueOrOptions || 'method' in firstValueOrOptions);

  if (hasOptions) {
    writeLog(firstValueOrOptions as LoggerOptions, values);
    return;
  }

  writeLog({}, [firstValueOrOptions, ...values]);
}

export function devLogger(...values: unknown[]): void {
  writeLog({ mode: 'development' }, values);
}

export function productionLogger(...values: unknown[]): void {
  writeLog({ mode: 'production' }, values);
}

export function alwaysLogger(...values: unknown[]): void {
  writeLog({ mode: 'always' }, values);
}
