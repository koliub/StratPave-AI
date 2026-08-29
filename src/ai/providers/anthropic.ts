import Anthropic from '@anthropic-ai/sdk';
import type { RoadmapProvider, GenerateRoadmapInput, GenerateSubRoadmapInput, AiProviderConfig } from './types';
import { buildRoadmapPrompt, buildSubRoadmapPrompt } from './prompts';

const ROADMAP_TOOL_NAME = 'emit_roadmap';

const roadmapTool: Anthropic.Tool = {
  name: ROADMAP_TOOL_NAME,
  description: 'Emit the generated project roadmap as structured data.',
  input_schema: {
    type: 'object',
    properties: {
      projectTitle: { type: 'string' },
      roadmap: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['id', 'title'],
        },
      },
    },
    required: ['projectTitle', 'roadmap'],
  },
};

export class AnthropicProvider implements RoadmapProvider {
  private client: Anthropic;
  private model: string;

  constructor(config: AiProviderConfig) {
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model || 'claude-sonnet-4-5';
  }

  private async generate(prompt: string): Promise<string | null> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      tools: [roadmapTool],
      tool_choice: { type: 'tool', name: ROADMAP_TOOL_NAME },
      messages: [{ role: 'user', content: prompt }],
    });

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );
    if (!toolUse) return null;
    return JSON.stringify(toolUse.input);
  }

  async generateRoadmap({ prompt }: GenerateRoadmapInput): Promise<string | null> {
    return this.generate(buildRoadmapPrompt(prompt));
  }

  async generateSubRoadmap(input: GenerateSubRoadmapInput): Promise<string | null> {
    return this.generate(buildSubRoadmapPrompt(input));
  }
}
