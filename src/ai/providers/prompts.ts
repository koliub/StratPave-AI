import type { GenerateSubRoadmapInput } from './types';

export function buildRoadmapPrompt(prompt: string): string {
  return `You are an expert project planner. Based on the user's project idea, generate a step-by-step roadmap.
Each step should be an actionable item.
User's project idea: "${prompt}"`;
}

export function buildSubRoadmapPrompt({ projectTitle, parentNode, nextNode }: GenerateSubRoadmapInput): string {
  return `Generate sub-roadmap points for the step "${parentNode.title}" and do not include the parent node in your output. only returning the sub nodes so not the node after or the initial node${
    parentNode.description ? ` with the description "${parentNode.description}".` : ''
  } for the overall project "${projectTitle}". ${
    nextNode
      ? `Consider that the next step is "${nextNode.title}"${
          nextNode.description ? ` with description "${nextNode.description}".` : ''
        } and ensure your points don't overlap with that.`
      : ''
  }`;
}

export const ROADMAP_JSON_CONTRACT = `Respond with ONLY a single minified JSON object (no markdown code fences, no commentary) matching exactly this shape:
{"projectTitle": string, "roadmap": [{"id": string, "title": string, "description": string}]}`;

export const extractValidJson = (text: string | undefined | null): string | null => {
  if (!text) return null;
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  const candidate = fenced ? fenced[1] : trimmed;
  return candidate.startsWith('{') ? candidate : null;
};
