import { GoogleGenAI } from '@google/genai';

export class Embedder {
  private ai: GoogleGenAI;
  private static readonly MODEL = 'gemini-embedding-001';
  private static readonly DIMS = 768;
  private static readonly BATCH_SIZE = 100;
  private static readonly RPM_DELAY_MS = 4100; // 15 RPM free tier

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async embedBatch(inputs: string[]): Promise<number[][]> {
    if (inputs.length === 0) return [];
    const results: number[][] = [];
    for (let i = 0; i < inputs.length; i += Embedder.BATCH_SIZE) {
      if (i > 0) await new Promise(r => setTimeout(r, Embedder.RPM_DELAY_MS));
      const batch = inputs.slice(i, i + Embedder.BATCH_SIZE);
      const resp = await this.ai.models.embedContent({
        model: Embedder.MODEL,
        contents: batch,
        config: { outputDimensionality: Embedder.DIMS },
      });
      results.push(...(resp.embeddings ?? []).map(e => e.values ?? []));
    }
    return results;
  }
}
