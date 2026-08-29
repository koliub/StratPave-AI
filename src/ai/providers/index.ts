import { prisma } from '@/lib/prisma';
import type { RoadmapProvider, AiProviderId } from './types';
import { AnthropicProvider } from './anthropic';
import { GoogleProvider } from './google';
import { OpenRouterProvider, CustomEndpointProvider } from './openai-compatible';

export { AI_PROVIDERS } from './meta';

export async function getActiveProvider(userId: string): Promise<RoadmapProvider> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { aiCredentials: true },
  });
  if (!user) throw new Error('User not found.');
  if (!user.activeAiProvider) {
    throw new Error('No AI provider configured yet. Add one in Settings.');
  }

  const credential = user.aiCredentials.find(c => c.provider === user.activeAiProvider);
  if (!credential) {
    throw new Error('No credential saved for the active AI provider. Add one in Settings.');
  }

  const config = { apiKey: credential.apiKey, model: credential.model, baseUrl: credential.baseUrl };

  switch (credential.provider as AiProviderId) {
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'google':
      return new GoogleProvider(config);
    case 'openrouter':
      return new OpenRouterProvider(config);
    case 'custom':
      return new CustomEndpointProvider(config);
    default:
      throw new Error(`Unknown AI provider: ${credential.provider}`);
  }
}
