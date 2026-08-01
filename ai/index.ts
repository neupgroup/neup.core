/*
::neup.documentation::core-ai-index
::title Core AI Response Helper

Provides a small provider-agnostic `getResponse()` helper for text AI calls.

::public

Use `getResponse(input, models)` when callers need a simple normalized response from OpenAI, Google AI, Anthropic, or OpenRouter.

The input may be the compact tuple `[inputData, context, prompt, supervisingPrompt, outputType]` or a named object with the same fields.

::public end

::private

This module stays in `core` by composing the low-level provider clients in `core/ai/direct` and `core/ai/relying`.

::private end

::end
*/

import { requestAnthropicCompletion } from '@/core/ai/direct/anthropic';
import { requestGoogleAiCompletion } from '@/core/ai/direct/googleai';
import { requestOpenAiCompletion } from '@/core/ai/direct/openai';
import type { DirectAiMessage, DirectAiRequest, DirectAiResult } from '@/core/ai/direct/types';
import { requestOpenRouterCompletion } from '@/core/ai/relying/openrouter';

export type AiOutputType = 'text' | 'image' | 'video' | 'audio' | 'json' | (string & {});

export type AiResponseTuple = [
  inputData?: unknown,
  context?: unknown,
  prompt?: string,
  supervisingPrompt?: string,
  outputType?: AiOutputType,
];

export type AiResponseInput = {
  inputData?: unknown;
  context?: unknown;
  prompt?: string;
  supervisingPrompt?: string;
  outputType?: AiOutputType;
};

export type AiModelProvider = 'openai' | 'googleai' | 'google' | 'anthropic' | 'openrouter' | (string & {});

export type AiModelInfo = {
  provider?: AiModelProvider;
  model: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
};

export type AiResponseResult = {
  response: string;
  outputType: AiOutputType;
  provider: string;
  model: string;
  raw: unknown;
};

type NormalizedAiInput = Required<AiResponseInput>;

type ProviderInvoker = (input: DirectAiRequest) => Promise<DirectAiResult>;

const TEXT_OUTPUT_TYPES = new Set<AiOutputType>(['text', 'json']);

const PROVIDER_INVOKERS: Record<string, ProviderInvoker> = {
  anthropic: requestAnthropicCompletion,
  google: requestGoogleAiCompletion,
  googleai: requestGoogleAiCompletion,
  openai: requestOpenAiCompletion,
  openrouter: requestOpenRouterCompletion,
};

export async function getResponse(
  input: AiResponseInput | AiResponseTuple,
  models: AiModelInfo | AiModelInfo[],
): Promise<AiResponseResult> {
  const normalizedInput = normalizeAiInput(input);

  if (!TEXT_OUTPUT_TYPES.has(normalizedInput.outputType)) {
    throw new Error(`Unsupported AI output type "${normalizedInput.outputType}". Only text and json are implemented.`);
  }

  const modelCandidates = Array.isArray(models) ? models : [models];
  const validModels = modelCandidates.filter((modelInfo) => modelInfo.model.trim() && modelInfo.apiKey.trim());

  if (validModels.length === 0) {
    throw new Error('At least one AI model with model and apiKey is required.');
  }

  let lastError: unknown = null;

  for (const modelInfo of validModels) {
    const provider = normalizeProvider(modelInfo);
    const invokeProvider = PROVIDER_INVOKERS[provider];

    if (!invokeProvider) {
      lastError = new Error(`Unsupported AI provider "${provider}".`);
      continue;
    }

    try {
      const result = await invokeProvider({
        apiKey: modelInfo.apiKey,
        model: normalizeModel(modelInfo),
        messages: buildMessages(normalizedInput),
        temperature: modelInfo.temperature,
        maxTokens: modelInfo.maxTokens,
      });

      return {
        response: result.text,
        outputType: normalizedInput.outputType,
        provider,
        model: normalizeModel(modelInfo),
        raw: result.raw,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('AI response request failed.');
}

function normalizeAiInput(input: AiResponseInput | AiResponseTuple): NormalizedAiInput {
  if (Array.isArray(input)) {
    const [inputData, context, prompt, supervisingPrompt, outputType] = input;

    return {
      inputData,
      context,
      prompt: prompt ?? '',
      supervisingPrompt: supervisingPrompt ?? '',
      outputType: outputType ?? 'text',
    };
  }

  return {
    inputData: input.inputData,
    context: input.context,
    prompt: input.prompt ?? '',
    supervisingPrompt: input.supervisingPrompt ?? '',
    outputType: input.outputType ?? 'text',
  };
}

function buildMessages(input: NormalizedAiInput): DirectAiMessage[] {
  const messages: DirectAiMessage[] = [];
  const systemPrompt = input.supervisingPrompt.trim();
  const promptParts = [
    input.prompt.trim(),
    formatSection('Input Data', input.inputData),
    formatSection('Context', input.context),
  ].filter(Boolean);

  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    });
  }

  messages.push({
    role: 'user',
    content: promptParts.join('\n\n') || 'Respond to the provided request.',
  });

  return messages;
}

function formatSection(title: string, value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  return `${title}:\n${stringifyValue(value)}`;
}

function stringifyValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function normalizeProvider(modelInfo: AiModelInfo): string {
  if (modelInfo.provider?.trim()) {
    return modelInfo.provider.trim().toLowerCase();
  }

  const slashIndex = modelInfo.model.indexOf('/');
  return slashIndex > 0 ? modelInfo.model.slice(0, slashIndex).trim().toLowerCase() : '';
}

function normalizeModel(modelInfo: AiModelInfo): string {
  const provider = normalizeProvider(modelInfo);
  const model = modelInfo.model.trim();
  const providerPrefix = `${provider}/`;

  return provider && model.toLowerCase().startsWith(providerPrefix) ? model.slice(providerPrefix.length) : model;
}

export type { DirectAiMessage, DirectAiRequest, DirectAiResult };
