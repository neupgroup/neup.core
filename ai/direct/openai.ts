/*
::neup.documentation::core-ai-direct-openai
::title Direct OpenAI Client

Calls the OpenAI Responses API directly.

::public

Use `requestOpenAiCompletion()` to send a normalized AI request to OpenAI without routing through Genkit.

::public end

::private

The client prefers the `output_text` field when available and falls back to concatenating text segments from the structured response output array.

::private end

::end
*/

import type { DirectAiRequest, DirectAiResult } from '@/core/ai/direct/googleai';

export async function requestOpenAiCompletion(input: DirectAiRequest): Promise<DirectAiResult> {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model: input.model,
      input: input.messages.map((message) => ({
        role: message.role,
        content: [
          {
            type: 'input_text',
            text: message.content,
          },
        ],
      })),
      ...(typeof input.temperature === 'number' ? { temperature: input.temperature } : {}),
      ...(typeof input.maxTokens === 'number' ? { max_output_tokens: input.maxTokens } : {}),
    }),
  });

  const raw = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof raw === 'object' && raw ? JSON.stringify(raw) : `OpenAI request failed with status ${response.status}.`,
    );
  }

  const structuredText = Array.isArray((raw as any)?.output)
    ? (raw as any).output
        .flatMap((item: any) => (Array.isArray(item?.content) ? item.content : []))
        .map((item: any) => item?.text ?? '')
        .join('')
        .trim()
    : '';

  const text = ((raw as any)?.output_text as string | undefined)?.trim() || structuredText;

  return { text, raw };
}
