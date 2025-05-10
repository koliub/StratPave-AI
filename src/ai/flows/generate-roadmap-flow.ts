'use server';
/**
 * @fileOverview Generates a project roadmap based on a user's prompt.
 *
 * - generateRoadmap - A function that takes a user prompt and returns a structured roadmap.
 * - GenerateRoadmapInput - The input type for the generateRoadmap function.
 * - GenerateRoadmapOutput - The return type for the generateRoadmap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RoadmapStepSchema = z.object({
  id: z.string().describe('A unique string identifier for the step (e.g., "step1", "task_alpha").'),
  title: z.string().describe('A concise title for the step (max 5 words).'),
  description: z.string().describe('A brief description of the step (max 2 sentences).'),
});

const GenerateRoadmapInputSchema = z.object({
  prompt: z.string().describe('The user\'s project idea or goal.'),
});
export type GenerateRoadmapInput = z.infer<typeof GenerateRoadmapInputSchema>;

const GenerateRoadmapOutputSchema = z.object({
  roadmap: z.array(RoadmapStepSchema).describe('An array of roadmap steps.'),
});
export type GenerateRoadmapOutput = z.infer<typeof GenerateRoadmapOutputSchema>;

export async function generateRoadmap(input: GenerateRoadmapInput): Promise<GenerateRoadmapOutput> {
  return generateRoadmapFlow(input);
}

const roadmapPrompt = ai.definePrompt({
  name: 'generateRoadmapPrompt',
  input: {schema: GenerateRoadmapInputSchema},
  output: {schema: GenerateRoadmapOutputSchema},
  prompt: `You are an expert project planner. Based on the user's project idea, generate a step-by-step roadmap.
Each step should be an actionable item.
Output the roadmap as a JSON object containing a "roadmap" key, which holds an array of step objects. Each step object must have the following fields:
- "id": A unique string identifier for the step (e.g., "step1", "research_market"). Use snake_case.
- "title": A concise title for the step (maximum 5 words).
- "description": A brief description of the step (maximum 2 sentences).

User's project idea: {{{prompt}}}

Provide only the JSON object as output. Do not include any other text, explanations, or markdown formatting.
Example output for "build a community garden":
{
  "roadmap": [
    { "id": "form_committee", "title": "Form Committee", "description": "Gather interested community members to form a planning committee." },
    { "id": "find_location", "title": "Find Location", "description": "Identify and secure a suitable plot of land for the garden." },
    { "id": "design_layout", "title": "Design Layout", "description": "Plan the garden layout, including plots, paths, and common areas." },
    { "id": "source_materials", "title": "Source Materials", "description": "Acquire soil, seeds, tools, and other necessary gardening supplies." },
    { "id": "build_garden", "title": "Build Garden", "description": "Prepare the land, build beds, and set up infrastructure." },
    { "id": "plant_seeds", "title": "Plant Seeds", "description": "Organize a community planting day to sow seeds and seedlings." }
  ]
}
`,
});

const generateRoadmapFlow = ai.defineFlow(
  {
    name: 'generateRoadmapFlow',
    inputSchema: GenerateRoadmapInputSchema,
    outputSchema: GenerateRoadmapOutputSchema,
  },
  async (input) => {
    const {output} = await roadmapPrompt(input);
    // Genkit with Zod schema should handle parsing and validation.
    // If output is null here, it means the LLM failed to produce valid JSON matching the schema.
    if (!output) {
      throw new Error('AI failed to generate a valid roadmap. The output was null.');
    }
    if (!output.roadmap || !Array.isArray(output.roadmap)) {
        throw new Error('AI failed to generate a valid roadmap. The roadmap array is missing or not an array.');
    }
    return output;
  }
);
