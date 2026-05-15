import OpenAI from 'openai';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export type ProviderKind = 'google' | 'featherless' | 'lmstudio';

const google = genkit({ plugins: [googleAI()] });

function resolveProvider(): ProviderKind {
  const raw = process.env.SENTINEL_MODEL_PROVIDER?.toLowerCase().trim();
  if (raw === 'google') return 'google';
  if (raw === 'featherless') return 'featherless';
  if (raw === 'lmstudio') return 'lmstudio';

  if (process.env.FEATHERLESS_API_KEY) return 'featherless';
  if (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) return 'google';
  if (process.env.LMSTUDIO_BASE_URL) return 'lmstudio';

  return 'google';
}

function openAIClientFor(provider: ProviderKind): OpenAI {
  if (provider === 'featherless') {
    return new OpenAI({
      apiKey: process.env.FEATHERLESS_API_KEY,
      baseURL: process.env.FEATHERLESS_BASE_URL ?? 'https://api.featherless.ai/v1'
    });
  }

  return new OpenAI({
    apiKey: process.env.LMSTUDIO_API_KEY ?? 'lm-studio',
    baseURL: process.env.LMSTUDIO_BASE_URL ?? 'http://127.0.0.1:1234/v1'
  });
}

export async function generateText(prompt: string, system: string): Promise<string> {
  const provider = resolveProvider();

  if (provider === 'google') {
    if (!process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY) {
      throw new Error('Google provider selected but GOOGLE_API_KEY/GEMINI_API_KEY is missing.');
    }
    const response = await google.generate({
      model: process.env.GENKIT_MODEL || 'googleai/gemini-2.5-flash',
      prompt: `${system}\n\nUser request: ${prompt}`
    });
    return response.text;
  }

  if (provider === 'featherless' && !process.env.FEATHERLESS_API_KEY) {
    throw new Error('Featherless provider selected but FEATHERLESS_API_KEY is missing.');
  }

  const client = openAIClientFor(provider);
  const model = provider === 'featherless'
    ? process.env.FEATHERLESS_MODEL ?? 'meta-llama/Meta-Llama-3.1-8B-Instruct'
    : process.env.LMSTUDIO_MODEL ?? 'local-model';

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2
  });

  return response.choices[0]?.message?.content ?? '';
}

export function getActiveProvider(): ProviderKind {
  return resolveProvider();
}
