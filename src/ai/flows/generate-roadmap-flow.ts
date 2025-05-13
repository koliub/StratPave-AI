'use server';
/**
 * @fileOverview Generates a project roadmap and sub-roadmaps based on a user's prompt.
 *
 * - generateRoadmap - A function that takes a user prompt and returns a structured roadmap.
 * - generateSubRoadmap - A function that takes a parent step and generates sub-steps for it.
 * - GenerateRoadmapInput - The input type for the generateRoadmap function.
 * - GenerateRoadmapOutput - The return type for the generateRoadmap function.
 * - GenerateSubRoadmapInput - The input type for the generateSubRoadmap function.
 * - GenerateSubRoadmapOutput - The return type for the generateSubRoadmap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RoadmapStepSchema = z.object({
  id: z.string().describe('A unique string identifier for the step (e.g., "step1", "task_alpha").'),
  title: z.string().describe('A concise title for the step (max 5 words).'),
  description: z.string().describe('A brief description of the step (max 2 sentences).'),
});

// Schemas and functions for an entire roadmap
const GenerateRoadmapInputSchema = z.object({
  prompt: z.string().describe("The user's project idea or goal."),
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
    if (!output) {
      throw new Error('AI failed to generate a valid roadmap. The output was null.');
    }
    if (!output.roadmap || !Array.isArray(output.roadmap)) {
        throw new Error('AI failed to generate a valid roadmap. The roadmap array is missing or not an array.');
    }
    return output;
  }
);

// Schemas and functions for sub-roadmap steps
const GenerateSubRoadmapInputSchema = z.object({
  projectPrompt: z.string().describe("The original user's project idea or goal."),
  parentStepId: z.string().describe('The ID of the parent roadmap step for which to generate sub-steps.'),
  parentStepTitle: z.string().describe('The title of the parent roadmap step.'),
  parentStepDescription: z.string().describe('The description of the parent roadmap step.'),
  mainRoadmapContext: z.string().optional().describe('A stringified list of all main roadmap steps (titles and descriptions) to provide overall project context and avoid overlap, especially with subsequent main steps.'),
});
export type GenerateSubRoadmapInput = z.infer<typeof GenerateSubRoadmapInputSchema>;

const GenerateSubRoadmapOutputSchema = z.object({
  subRoadmap: z.array(RoadmapStepSchema).describe('An array of sub-roadmap steps for the parent step.'),
});
export type GenerateSubRoadmapOutput = z.infer<typeof GenerateSubRoadmapOutputSchema>;

export async function generateSubRoadmap(input: GenerateSubRoadmapInput): Promise<GenerateSubRoadmapOutput> {
  return generateSubRoadmapFlow(input);
}

const subRoadmapPrompt = ai.definePrompt({
  name: 'generateSubRoadmapPrompt',
  input: {schema: GenerateSubRoadmapInputSchema},
  output: {schema: GenerateSubRoadmapOutputSchema},
  prompt: `You are an expert project planner. The overall project is: {{{projectPrompt}}}.
You are currently focused on breaking down a specific step of this project.

The parent step is:
- ID: {{{parentStepId}}}
- Title: {{{parentStepTitle}}}
- Description: {{{parentStepDescription}}}

{{#if mainRoadmapContext}}
To provide better context and avoid overlap with other main project steps, here is the overall main roadmap:
{{mainRoadmapContext}}

Focus on creating sub-steps ONLY for the parent step mentioned above. Ensure these sub-steps do not preempt or duplicate tasks that belong to other main roadmap steps, especially those that come after the current parent step in the main roadmap.
{{/if}}

Generate a list of 2-4 actionable sub-steps to accomplish THIS parent step. Each sub-step should be a smaller, manageable task directly related to the parent step.
Output the sub-steps as a JSON object containing a "subRoadmap" key, which holds an array of step objects. Each step object must have the following fields:
- "id": A unique string identifier for the sub-step (e.g., "{{parentStepId}}_sub1", "{{parentStepId}}_task_child"). Use snake_case and incorporate the parent step ID.
- "title": A concise title for the sub-step (maximum 5 words).
- "description": A brief description of the sub-step (maximum 2 sentences).

Provide only the JSON object as output. Do not include any other text, explanations, or markdown formatting.
Example for a parent step "id: design_layout, title: Design Layout, description: Plan the garden layout..." with project "build a community garden":
{
  "subRoadmap": [
    { "id": "design_layout_sketch", "title": "Sketch Ideas", "description": "Create initial sketches of potential garden layouts." },
    { "id": "design_layout_feedback", "title": "Get Feedback", "description": "Share sketches with the committee and gather feedback." },
    { "id": "design_layout_finalize", "title": "Finalize Plan", "description": "Create a final detailed layout plan based on feedback." }
  ]
}
`,
});

const generateSubRoadmapFlow = ai.defineFlow(
  {
    name: 'generateSubRoadmapFlow',
    inputSchema: GenerateSubRoadmapInputSchema,
    outputSchema: GenerateSubRoadmapOutputSchema,
  },
  async (input) => {
    const {output} = await subRoadmapPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate valid sub-roadmap steps. The output was null.');
    }
    if (!output.subRoadmap || !Array.isArray(output.subRoadmap)) {
      throw new Error('AI failed to generate valid sub-roadmap steps. The subRoadmap array is missing or not an array.');
    }
    // Ensure sub-step IDs are unique and related to the parent
    output.subRoadmap.forEach((step, index) => {
      // Ensure ID is unique and related, even if LLM doesn't follow instructions perfectly
      const safeParentId = input.parentStepId.replace(/[^a-zA-Z0-9_]/g, '_');
      const subIdSuffix = step.title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').substring(0,15) || `sub${index + 1}`;
      step.id = `${safeParentId}_${subIdSuffix}`;
    });
    return output;
  }
);
