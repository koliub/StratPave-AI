import type { RoadmapProvider, GenerateRoadmapInput, GenerateSubRoadmapInput, AiProviderConfig } from './types';
import { buildRoadmapPrompt, buildSubRoadmapPrompt, extractValidJson, ROADMAP_JSON_CONTRACT } from './prompts';

export class OpenAiCompatibleProvider implements RoadmapProvider {
  constructor(
    private config: AiProviderConfig,
    private baseUrl: string,
    private defaultModel: string,
    private extraHeaders: Record<string, string> = {}
  ) {}

  private async generate(prompt: string): Promise<string | null> {
    const res = await fetch(`${this.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
        ...this.extraHeaders,
      },
      body: JSON.stringify({
        model: this.config.model || this.defaultModel,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: ROADMAP_JSON_CONTRACT },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`AI provider request failed (${res.status}): ${body || res.statusText}`);
    }

    const data = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    return extractValidJson(text);
  }

  async generateRoadmap({ prompt }: GenerateRoadmapInput): Promise<string | null> {
    return this.generate(buildRoadmapPrompt(prompt));
  }

  async generateSubRoadmap(input: GenerateSubRoadmapInput): Promise<string | null> {
    return this.generate(buildSubRoadmapPrompt(input));
  }
}

export class OpenRouterProvider extends OpenAiCompatibleProvider {
  constructor(config: AiProviderConfig) {
    super(config, 'https://openrouter.ai/api/v1', 'openai/gpt-4o-mini');
  }
}

export class CustomEndpointProvider extends OpenAiCompatibleProvider {
  constructor(config: AiProviderConfig) {
    if (!config.baseUrl) throw new Error('A base URL is required for the custom AI provider.');
    if (!config.model) throw new Error('A model name is required for the custom AI provider.');
    super(config, config.baseUrl, config.model);
  }
}
