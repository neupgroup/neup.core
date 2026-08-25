/*
::neup.documentation::core-ai-relying-omniroute
::title OmniRoute Client

Connects to an OmniRoute server through its OpenAI-compatible chat completions endpoint.

::public

Use `requestOmniRouteCompletion()` to send the shared AI request shape to OmniRoute.

::public end

::private

The server URL and optional fallback API key are read from `OMNIROUTE_URL` and
`OMNIROUTE_API_KEY`. OmniRoute's default local server port is used when no URL is configured.

::private end

::end
*/

import type { DirectAiRequest, DirectAiResult } from '@/core/ai/_types';
import { getEnvVariable } from '@/core/helpers/env';

const DEFAULT_OMNIROUTE_URL = 'http://localhost:20128';

function getOmniRouteEndpoint(): string {
  const configuredUrl = getEnvVariable('OMNIROUTE_URL') || DEFAULT_OMNIROUTE_URL;
  return `${configuredUrl.replace(/\/+$/, '')}/v1/chat/completions`;
}

export async function requestOmniRouteCompletion(input: DirectAiRequest): Promise<DirectAiResult> {
  const apiKey = input.apiKey.trim() || getEnvVariable('OMNIROUTE_API_KEY') || '';
  const response = await fetch(getOmniRouteEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: input.model,
      messages: input.messages,
      ...(typeof input.temperature === 'number' ? { temperature: input.temperature } : {}),
      ...(typeof input.maxTokens === 'number' ? { max_tokens: input.maxTokens } : {}),
      stream: false,
    }),
  });

  const raw = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof raw === 'object' && raw
        ? JSON.stringify(raw)
        : `OmniRoute request failed with status ${response.status}.`,
    );
  }

  const content = (raw as { choices?: Array<{ message?: { content?: unknown } }> } | null)?.choices?.[0]?.message?.content;
  const text = typeof content === 'string' ? content.trim() : '';

  return { text, raw };
}
