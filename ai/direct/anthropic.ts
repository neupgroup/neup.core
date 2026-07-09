/*
::neup.documentation::core-ai-direct-anthropic
::title Direct Anthropic Client

Calls the Anthropic Messages API directly.

::public

Use `requestAnthropicCompletion()` to send a normalized AI request to Anthropic models without Genkit.

::public end

::private

System prompts are lifted out of the shared message array into Anthropic's top-level `system` field, while the remaining conversation is passed as `messages`.

::private end

::end
*/

import type { DirectAiRequest, DirectAiResult } from '@/core/ai/direct/googleai';

export async function requestAnthropicCompletion(input: DirectAiRequest): Promise<DirectAiResult> {
  const system = input.messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content.trim())
    .filter(Boolean)
    .join('\n\n');

  const messages = input.messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content,
    }));

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': input.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: input.maxTokens ?? 1024,
      messages,
      ...(system ? { system } : {}),
      ...(typeof input.temperature === 'number' ? { temperature: input.temperature } : {}),
    }),
  });

  const raw = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof raw === 'object' && raw ? JSON.stringify(raw) : `Anthropic request failed with status ${response.status}.`,
    );
  }

  const text = Array.isArray((raw as any)?.content)
    ? (raw as any).content
        .filter((item: any) => item?.type === 'text')
        .map((item: any) => item?.text ?? '')
        .join('')
        .trim()
    : '';

  return { text, raw };
}
