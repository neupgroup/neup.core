/*
::neup.documentation::core-helper-metadata
::title Metadata Helper

Shared metadata helpers for formatting page titles.

::public

Import metadata helpers from `@/core/metadata`.

This file is a compatibility export for older helper-path imports.

::public end

::private

Core metadata stays generic and must not read cookies or application database tables.

::private end

::end
*/

export {
  APP_NAME,
  DEFAULT_META_DESCRIPTION,
  formMetadata,
  formatAppTitle,
} from '@/core/metadata';
