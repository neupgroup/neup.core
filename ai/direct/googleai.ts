/*
::neup.documentation::core-ai-direct-googleai
::title Direct Google AI Client

Calls the Gemini REST API directly without using Genkit.

::public

Use `requestGoogleAiCompletion()` to send a normalized AI request to the Gemini `generateContent` endpoint.

The caller provides the API key, model, prompt messages, and optional generation settings.

::public end

::private

This client maps the shared AI message format into Gemini `contents` plus optional `system_instruction`, then extracts the best-effort text response from the first candidate.

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

export async function requestGoogleAiCompletion(input: DirectAiRequest): Promise<DirectAiResult> {
  const systemMessage = input.messages.find((message) => message.role === 'system')?.content?.trim();
  const conversationMessages = input.messages.filter((message) => message.role !== 'system');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(input.model)}:generateContent?key=${encodeURIComponent(input.apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: conversationMessages.map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }],
        })),
        ...(systemMessage
          ? {
              system_instruction: {
                parts: [{ text: systemMessage }],
              },
            }
          : {}),
        generationConfig: {
          ...(typeof input.temperature === 'number' ? { temperature: input.temperature } : {}),
          ...(typeof input.maxTokens === 'number' ? { maxOutputTokens: input.maxTokens } : {}),
        },
      }),
    },
  );

  const raw = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof raw === 'object' && raw && 'error' in raw
        ? JSON.stringify(raw)
        : `Google AI request failed with status ${response.status}.`,
    );
  }

  const text =
    (raw as any)?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part?.text ?? '')
      .join('')
      .trim() ?? '';

  return { text, raw };
}
