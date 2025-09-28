'use server';

/**
 * @fileOverview Generates a draft quote from a text prompt.
 *
 * - generateQuoteFromPrompt - A function that generates a quote from a text prompt.
 * - GenerateQuoteFromPromptInput - The input type for the generateQuoteFromPrompt function.
 * - GenerateQuoteFromPromptOutput - The return type for the generateQuoteFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuoteFromPromptInputSchema = z.object({
  prompt: z.string().describe('A text prompt describing the services and customer for the quote.'),
});
export type GenerateQuoteFromPromptInput = z.infer<typeof GenerateQuoteFromPromptInputSchema>;

const GenerateQuoteFromPromptOutputSchema = z.object({
  quoteDraft: z.string().describe('A draft quote generated from the prompt.'),
});
export type GenerateQuoteFromPromptOutput = z.infer<typeof GenerateQuoteFromPromptOutputSchema>;

export async function generateQuoteFromPrompt(input: GenerateQuoteFromPromptInput): Promise<GenerateQuoteFromPromptOutput> {
  return generateQuoteFromPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuoteFromPromptPrompt',
  input: {schema: GenerateQuoteFromPromptInputSchema},
  output: {schema: GenerateQuoteFromPromptOutputSchema},
  prompt: `You are an AI assistant that generates quote drafts based on user prompts.  The quote should include company information, customer information, a list of items/services, and a total.  Use a professional tone.

Prompt: {{{prompt}}}`,
});

const generateQuoteFromPromptFlow = ai.defineFlow(
  {
    name: 'generateQuoteFromPromptFlow',
    inputSchema: GenerateQuoteFromPromptInputSchema,
    outputSchema: GenerateQuoteFromPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
