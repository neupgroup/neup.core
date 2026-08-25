/*
::neup.documentation::core-ai-direct-types
::title Direct AI Shared Types

Defines the provider-agnostic request and response types used by the direct AI clients.

::public

Import `DirectAiMessage`, `DirectAiRequest`, and `DirectAiResult` from this module when sharing types across direct AI providers.

::public end

::private

These types live separately from provider implementations so Anthropic, OpenAI, OpenRouter, and Google AI do not depend on one another.

::private end

::end
*/

export type DirectAiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type DirectAiRequest = {
  apiKey: string;
  model: string;
  messages: DirectAiMessage[];
  temperature?: number;
  maxTokens?: number;
};

export type DirectAiResult = {
  text: string;
  raw: unknown;
};
