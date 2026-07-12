/*
::neup.documentation::core-auth-events
::title Auth Events

Core browser event names used to notify client providers that authentication state changed.

::public

Dispatch `AUTH_STATE_CHANGED_EVENT` on `window` after sign-in, sign-out, or account switching so core session consumers can clear stale cache.

::public end

::end
*/

export const AUTH_STATE_CHANGED_EVENT = 'neup:auth-state-changed';
