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


const processLogoFlow = ai.defineFlow(
  {
    name: 'processLogoFlow',
    inputSchema: ProcessLogoInputSchema,
    outputSchema: ProcessLogoOutputSchema,
  },
  async ({ logoDataUri }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        { media: { url: logoDataUri } },
        { text: 'Take this logo. The final image dimensions must be exactly 240px wide and 90px tall. Resize the original logo to fit within these dimensions while maintaining its aspect ratio. Place the resized logo onto a completely transparent background. Do not add any shadows, borders, or effects. The output must be a PNG file with full transparency.' },
      ],
      config: {
        responseModalities: ['IMAGE'],
      }
    });

    if (!media?.url) {
      throw new Error('AI did not return an optimized logo.');
    }

    return {
      optimizedLogoUrl: media.url
    };
  }
);
