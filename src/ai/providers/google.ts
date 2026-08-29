import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';
import type { RoadmapProvider, GenerateRoadmapInput, GenerateSubRoadmapInput, AiProviderConfig } from './types';
import { buildRoadmapPrompt, buildSubRoadmapPrompt, extractValidJson } from './prompts';

const roadmapSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    projectTitle: { type: SchemaType.STRING },
    roadmap: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
        },
        required: ['id', 'title'],
      },
    },
  },
  required: ['projectTitle', 'roadmap'],
};

export class GoogleProvider implements RoadmapProvider {
  private model;

  constructor(config: AiProviderConfig) {
    const genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = genAI.getGenerativeModel({
      model: config.model || 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: roadmapSchema,
      },
    });
  }

  async generateRoadmap({ prompt }: GenerateRoadmapInput): Promise<string | null> {
    const result = await this.model.generateContent(buildRoadmapPrompt(prompt));
    return extractValidJson(result.response.text());
  }

  async generateSubRoadmap(input: GenerateSubRoadmapInput): Promise<string | null> {
    const result = await this.model.generateContent(buildSubRoadmapPrompt(input));
    return extractValidJson(result.response.text());
  }
}
