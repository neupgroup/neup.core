<!--
::neup.documentation::core-ai-module
::title Core AI Providers

Documents the direct and relying AI provider clients exposed from `core/ai`.

::public

`core/ai/direct/*` contains thin HTTP clients for providers that are called directly without Genkit.

`core/ai/relying/*` contains clients for upstream AI gateways such as OpenRouter.

These modules are intentionally low-level and return normalized provider payloads so route handlers can stay thin.

::public end

::private

The AI route layer validates request bodies in `services/ai/provider-endpoint-service.ts`, then delegates outbound HTTP calls to the provider clients in this folder.

::private end

::end
-->

# Core AI

This folder contains provider-specific HTTP clients for AI endpoints that should not depend on Genkit.
