'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { AiProviderId } from '@/ai/providers/types';

export interface AiCredentialView {
  provider: AiProviderId;
  hasApiKey: boolean;
  model: string | null;
  baseUrl: string | null;
}

export async function getAiSettings(): Promise<{ activeProvider: string | null; credentials: AiCredentialView[] }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Not authenticated.');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { aiCredentials: true },
  });
  if (!user) throw new Error('User not found.');

  return {
    activeProvider: user.activeAiProvider,
    credentials: user.aiCredentials.map(c => ({
      provider: c.provider as AiProviderId,
      hasApiKey: !!c.apiKey,
      model: c.model,
      baseUrl: c.baseUrl,
    })),
  };
}

export async function saveAiCredential(
  provider: AiProviderId,
  data: { apiKey: string; model?: string; baseUrl?: string }
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Not authenticated.');
  if (!data.apiKey.trim()) throw new Error('An API key is required.');

  await prisma.$transaction([
    prisma.aiCredential.upsert({
      where: { userId_provider: { userId: session.user.id, provider } },
      create: {
        userId: session.user.id,
        provider,
        apiKey: data.apiKey,
        model: data.model || null,
        baseUrl: data.baseUrl || null,
      },
      update: {
        apiKey: data.apiKey,
        model: data.model || null,
        baseUrl: data.baseUrl || null,
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { activeAiProvider: provider },
    }),
  ]);
}

export async function setActiveAiProvider(provider: AiProviderId): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Not authenticated.');

  const credential = await prisma.aiCredential.findUnique({
    where: { userId_provider: { userId: session.user.id, provider } },
  });
  if (!credential) throw new Error('Add an API key for this provider before activating it.');

  await prisma.user.update({
    where: { id: session.user.id },
    data: { activeAiProvider: provider },
  });
}

export async function deleteAiCredential(provider: AiProviderId): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Not authenticated.');

  await prisma.aiCredential.delete({
    where: { userId_provider: { userId: session.user.id, provider } },
  });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.activeAiProvider === provider) {
    await prisma.user.update({ where: { id: session.user.id }, data: { activeAiProvider: null } });
  }
}
