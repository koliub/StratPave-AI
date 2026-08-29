'use server';

import { auth } from '@/auth';
import { getActiveProvider } from '@/ai/providers';
import type { GenerateRoadmapInput, GenerateSubRoadmapInput } from '@/ai/providers/types';

export async function generateRoadmap(input: GenerateRoadmapInput): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Please log in to generate a roadmap.');
  }
  const provider = await getActiveProvider(session.user.id);
  return provider.generateRoadmap(input);
}

export async function generateSubRoadmap(input: GenerateSubRoadmapInput): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Please log in to generate a roadmap.');
  }
  const provider = await getActiveProvider(session.user.id);
  return provider.generateSubRoadmap(input);
}
