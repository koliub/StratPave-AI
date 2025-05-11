'use server';
/**
 * @fileOverview Generates a sub-roadmap for a given step within a larger project.
 *
 * - generateSubRoadmap - A function that takes a main project prompt and a parent step's details to generate sub-steps.
 * - GenerateSubRoadmapInput - The input type for the generateSubRoadmap function.
 * - GenerateSubRoadmapOutput - The return type for the generateSubRoadmap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Re-using the RoadmapStepSchema from the main roadmap flow for consistency
const RoadmapStepSchema = z.object({
  id: z.string().describe('A unique string identifier for the sub-step (e.g., "sub_task_1", "detail_alpha"). Use snake_case.'),
  title: z.string().describe('A concise title for the sub-step (max 5 words).'),
  description: z.string().describe('A brief description of the sub-step (max 2 sentences).'),
});

const GenerateSubRoadmapInputSchema = z.object({
  mainProjectPrompt: z.string().describe("The overall goal or prompt of the main project."),
  parentStepTitle: z.string().describe("The title of the parent roadmap step that needs tobe broken down."),
  parentStepDescription: z.string().optional().describe("The description of the parent roadmap step."),
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
  prompt: `You are an expert project planner. You are tasked with breaking down a specific step of a larger project into smaller, actionable sub-steps.

The main project is about: {{{mainProjectPrompt}}}

The parent step you need to break down is:
Title: {{{parentStepTitle}}}
{{#if parentStepDescription}}Description: {{{parentStepDescription}}}{{/if}}

Generate a list of 2 to 5 granular sub-steps to accomplish this parent step. These sub-steps should be actionable and directly contribute to completing the parent step, keeping in mind the context of the main project.
Avoid creating sub-steps that are too broad or are essentially the parent step rephrased.
Do not repeat information already covered by the main project prompt or the parent step's title/description unless necessary for clarity of a sub-step.

Output the sub-roadmap as a JSON object containing a "subRoadmap" key, which holds an array of sub-step objects. Each sub-step object must have the following fields:
- "id": A unique string identifier for the sub-step (e.g., "sub_task_1", "research_market_detail_a"). Use snake_case and ensure it's distinct from other sub-steps.
- "title": A concise title for the sub-step (maximum 5 words).
- "description": A brief description of the sub-step (maximum 2 sentences).

User's parent step details:
Main Project: {{{mainProjectPrompt}}}
Parent Step Title: {{{parentStepTitle}}}
{{#if parentStepDescription}}Parent Step Description: {{{parentStepDescription}}}{{/if}}

Provide only the JSON object as output. Do not include any other text, explanations, or markdown formatting.
Example output for parent step "Source Materials" (main project "Build a Community Garden"):
{
  "subRoadmap": [
    { "id": "list_required_materials", "title": "List Materials", "description": "Create a comprehensive list of all tools, seeds, soil, and compost needed." },
    { "id": "get_supplier_quotes", "title": "Get Quotes", "description": "Contact local suppliers for price quotes on the listed materials." },
    { "id": "organize_purchase_pickup", "title": "Organize Purchase", "description": "Coordinate the purchase and pickup or delivery of all materials." }
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
      throw new Error('AI failed to generate a valid sub-roadmap. The output was null.');
    }
     if (!output.subRoadmap || !Array.isArray(output.subRoadmap)) {
        throw new Error('AI failed to generate a valid sub-roadmap. The subRoadmap array is missing or not an array.');
    }
    // Ensure IDs are unique within the sub-roadmap, prefixing if necessary
    // (though the AI should be instructed to make them unique)
    // This is more of a safeguard.
    const uniqueOutput = {
      ...output,
      subRoadmap: output.subRoadmap.map((step, index) => ({
        ...step,
        id: `sub_${input.parentStepTitle.replace(/\s+/g, '_').toLowerCase()}_${step.id}_${index}` // Ensure unique enough ID
      }))
    };
    return uniqueOutput;
  }
);
