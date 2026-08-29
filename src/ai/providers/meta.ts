import type { AiProviderId } from './types';

export const AI_PROVIDERS: { id: AiProviderId; label: string; needsBaseUrl?: boolean; needsModel?: boolean }[] = [
  { id: 'anthropic', label: 'Anthropic (Claude)' },
  { id: 'google', label: 'Google AI (Gemini)' },
  { id: 'openrouter', label: 'OpenRouter', needsModel: true },
  { id: 'custom', label: 'Custom endpoint', needsBaseUrl: true, needsModel: true },
];
