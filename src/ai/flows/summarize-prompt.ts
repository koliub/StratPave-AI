// src/ai/flows/summarize-prompt.ts
'use server';

/**
 * @fileOverview Summarizes a prompt into a single word using AI.
 *
 * - summarizePrompt - A function that takes a prompt and returns a single word summary.
 * - SummarizePromptInput - The input type for the summarizePrompt function.
 * - SummarizePromptOutput - The return type for the summarizePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizePromptInputSchema = z.object({
  prompt: z.string().describe('The prompt to summarize.'),
});
export type SummarizePromptInput = z.infer<typeof SummarizePromptInputSchema>;

const SummarizePromptOutputSchema = z.object({
  singleWord: z.string().describe('The single word summary of the prompt.'),
});
export type SummarizePromptOutput = z.infer<typeof SummarizePromptOutputSchema>;

export async function summarizePrompt(input: SummarizePromptInput): Promise<SummarizePromptOutput> {
  return summarizePromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizePromptPrompt',
  input: {schema: SummarizePromptInputSchema},
  output: {schema: SummarizePromptOutputSchema},
  prompt: `Summarize the following prompt into a single word:\n\n{{prompt}}`,
});

const summarizePromptFlow = ai.defineFlow(
  {
    name: 'summarizePromptFlow',
    inputSchema: SummarizePromptInputSchema,
    outputSchema: SummarizePromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
