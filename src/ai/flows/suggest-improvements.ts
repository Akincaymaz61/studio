'use server';

/**
 * @fileOverview An AI tool that reviews a quote and suggests improvements.
 *
 * - suggestImprovements - A function that takes quote details and returns suggestions for improvement.
 * - SuggestImprovementsInput - The input type for the suggestImprovements function.
 * - SuggestImprovementsOutput - The return type for the suggestImprovements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestImprovementsInputSchema = z.object({
  companyName: z.string().describe('The name of the company providing the quote.'),
  customerName: z.string().describe('The name of the customer receiving the quote.'),
  items: z.array(
    z.object({
      description: z.string().describe('Description of the item or service.'),
      quantity: z.number().describe('Quantity of the item.'),
      unit: z.string().describe('Unit of measurement for the item (e.g., adet, saat).'),
      price: z.number().describe('Price per unit of the item.'),
      tax: z.number().describe('Tax rate for the item (e.g., 0, 8, 18).'),
    })
  ).describe('List of items or services included in the quote.'),
  notes: z.string().describe('Any additional notes or terms and conditions for the quote.'),
});
export type SuggestImprovementsInput = z.infer<typeof SuggestImprovementsInputSchema>;

const SuggestImprovementsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('List of suggested improvements for the quote.'),
});
export type SuggestImprovementsOutput = z.infer<typeof SuggestImprovementsOutputSchema>;

export async function suggestImprovements(input: SuggestImprovementsInput): Promise<SuggestImprovementsOutput> {
  return suggestImprovementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestImprovementsPrompt',
  input: {schema: SuggestImprovementsInputSchema},
  output: {schema: SuggestImprovementsOutputSchema},
  prompt: `You are an AI assistant that reviews quotes and suggests improvements to make them more professional and complete.

  Review the following quote information and provide a list of suggestions for improvement. Focus on missing information, wording, and overall presentation.

  Company Name: {{{companyName}}}
  Customer Name: {{{customerName}}}
  Items:{{#each items}}\n- Description: {{{description}}}, Quantity: {{{quantity}}}, Unit: {{{unit}}}, Price: {{{price}}}, Tax: {{{tax}}}{{/each}}
  Notes: {{{notes}}}
  \nConsider things like professional tone, completeness of information, clarity, and potential issues.
  Format suggestions as a numbered list. Be concise and specific.
  `, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
});

const suggestImprovementsFlow = ai.defineFlow(
  {
    name: 'suggestImprovementsFlow',
    inputSchema: SuggestImprovementsInputSchema,
    outputSchema: SuggestImprovementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
