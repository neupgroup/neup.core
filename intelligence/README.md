<!--
::neup.documentation::core-ai-module
::title Core AI Providers

Documents the AI provider clients exposed from `core/intelligence`.

::public

The provider files in `core/intelligence` are thin HTTP clients for providers and upstream AI gateways.
`_types.ts` contains the shared provider-agnostic request and response types.

These modules are intentionally low-level and return normalized provider payloads so route handlers can stay thin.

::public end

::private

The AI route layer validates request bodies in `services/intelligence`, then delegates outbound HTTP calls to the provider clients in this folder.

::private end

::end
-->

# Core Intelligence

This folder contains provider-specific HTTP clients for intelligence endpoints that should not depend on Genkit.
