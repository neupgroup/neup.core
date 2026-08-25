/*
::neup.documentation::core-intelligence-cerebras
::title Direct Cerebras Client

Calls Cerebras Inference's chat completions API directly.

::public

Use `requestCerebrasCompletion()` to send the shared intelligence request shape to Cerebras.

::public end

::private

This provider uses Cerebras's raw `/v1/chat/completions` endpoint and does not depend on Genkit.

::private end

::end
*/

import type { DirectAiRequest, DirectAiResult } from '@/core/intelligence/_types';

export async function requestCerebrasCompletion(input: DirectAiRequest): Promise<DirectAiResult> {
  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.apiKey}`,
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
        : `Cerebras request failed with status ${response.status}.`,
    );
  }

  const content = (raw as { choices?: Array<{ message?: { content?: unknown } }> } | null)?.choices?.[0]?.message?.content;

  return {
    text: typeof content === 'string' ? content.trim() : '',
    raw,
  };
}
