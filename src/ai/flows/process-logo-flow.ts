'use server';
/**
 * @fileOverview Logo işleme için bir AI akışı.
 *
 * - processLogo - Kullanıcının yüklediği bir logoyu işler, yeniden boyutlandırır ve optimize eder.
 * - ProcessLogoInput - processLogo fonksiyonu için giriş tipi.
 * - ProcessLogoOutput - processLogo fonksiyonu için dönüş tipi.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessLogoInputSchema = z.object({
  logoDataUri: z
    .string()
    .describe(
      "Bir logo resmi, MIME tipi ve Base64 kodlaması içermesi gereken bir data URI olarak. Beklenen format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ProcessLogoInput = z.infer<typeof ProcessLogoInputSchema>;

const ProcessLogoOutputSchema = z.object({
    optimizedLogoUrl: z.string().describe("Optimizie edilmiş ve yeniden boyutlandırılmış logo için bir data URI.")
});
export type ProcessLogoOutput = z.infer<typeof ProcessLogoOutputSchema>;

export async function processLogo(input: ProcessLogoInput): Promise<ProcessLogoOutput> {
  return processLogoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processLogoPrompt',
  input: {schema: ProcessLogoInputSchema},
  output: {schema: ProcessLogoOutputSchema},
  prompt: `You are an expert image processor. You will take the provided logo image and process it.
The output should be a PNG file, resized to be 240px wide and 90px tall. The image should be optimized for web usage.
Do not change the aspect ratio, fit it within the dimensions by padding with transparent background if necessary.
Return the result as a data URI.

Image: {{media url=logoDataUri}}`,
});

const processLogoFlow = ai.defineFlow(
  {
    name: 'processLogoFlow',
    inputSchema: ProcessLogoInputSchema,
    outputSchema: ProcessLogoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
