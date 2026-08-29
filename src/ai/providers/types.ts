export interface GenerateRoadmapInput {
  prompt: string;
}

export interface GenerateSubRoadmapInput {
  projectTitle: string;
  parentNode: { title: string; description: string };
  nextNode?: { title: string; description: string };
}

export interface RoadmapProvider {
  generateRoadmap(input: GenerateRoadmapInput): Promise<string | null>;
  generateSubRoadmap(input: GenerateSubRoadmapInput): Promise<string | null>;
}

export type AiProviderId = 'anthropic' | 'google' | 'openrouter' | 'custom';

export interface AiProviderConfig {
  apiKey: string;
  model?: string | null;
  baseUrl?: string | null;
}
