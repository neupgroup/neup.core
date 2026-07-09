/*
::neup.documentation::core-ai-relying-openrouter
::title OpenRouter Client

Calls OpenRouter as an upstream AI gateway.

::public

Use `requestOpenRouterCompletion()` to send the shared AI request shape to OpenRouter's chat completions API.

::public end

::private

Optional site headers are forwarded when configured so OpenRouter requests can be attributed to the Neup deployment.

::private end

::end
*/

import type { DirectAiRequest, DirectAiResult } from '@/core/ai/direct/googleai';

export async function requestOpenRouterCompletion(input: DirectAiRequest): Promise<DirectAiResult> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.apiKey}`,
      ...(process.env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL } : {}),
      ...(process.env.OPENROUTER_SITE_NAME ? { 'X-Title': process.env.OPENROUTER_SITE_NAME } : {}),
    },
    body: JSON.stringify({
      model: input.model,
      messages: input.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      ...(typeof input.temperature === 'number' ? { temperature: input.temperature } : {}),
      ...(typeof input.maxTokens === 'number' ? { max_tokens: input.maxTokens } : {}),
    }),
  });

  const raw = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof raw === 'object' && raw ? JSON.stringify(raw) : `OpenRouter request failed with status ${response.status}.`,
    );
  }

  const text = ((raw as any)?.choices?.[0]?.message?.content as string | undefined)?.trim() ?? '';

  return { text, raw };
}
