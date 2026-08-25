/*
::neup.documentation::core-intelligence-mistral
::title Direct Mistral Client

Calls Mistral's chat completions API directly.

::public

Use `requestMistralCompletion()` to send the shared intelligence request shape to Mistral.

::public end

::private

This provider uses Mistral's OpenAI-compatible `/v1/chat/completions` endpoint and does not depend on Genkit.

::private end

::end
*/

import type { DirectAiRequest, DirectAiResult } from '@/core/intelligence/_types';

type MistralContentPart = {
  type?: unknown;
  text?: unknown;
};

function readMessageText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (!Array.isArray(value)) {
    return '';
  }

  return value
    .map((part) => {
      if (!part || typeof part !== 'object' || Array.isArray(part)) {
        return '';
      }

      const contentPart = part as MistralContentPart;
      return contentPart.type === 'text' && typeof contentPart.text === 'string' ? contentPart.text : '';
    })
    .join('');
}

export async function requestMistralCompletion(input: DirectAiRequest): Promise<DirectAiResult> {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
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
      typeof raw === 'object' && raw ? JSON.stringify(raw) : `Mistral request failed with status ${response.status}.`,
    );
  }

  const content = (raw as { choices?: Array<{ message?: { content?: unknown } }> } | null)?.choices?.[0]?.message?.content;

  return {
    text: readMessageText(content).trim(),
    raw,
  };
}
