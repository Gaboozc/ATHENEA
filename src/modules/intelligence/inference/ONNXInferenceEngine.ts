/**
 * ATHENEA ONNX Inference Engine
 * 
 * Lightweight local NLU using Transformers.js with all-MiniLM-L6-v2
 * Used as Smart Path when Fast Path (regex) fails to match intent.
 * 
 * Architecture:
 * - Computes sentence embeddings for user prompt
 * - Compares against pre-computed skill embeddings
 * - Returns top-k most similar skills with confidence scores
 * 
 * Model: sentence-transformers/all-MiniLM-L6-v2 (22MB, runs in browser)
 * Latency: ~50-150ms on modern devices
 */

import { pipeline, env } from '@xenova/transformers';
import type { SkillManifest } from '../types';

// Disable local model caching in development (use CDN)
env.allowLocalModels = false;
env.useBrowserCache = true;

export interface InferenceResult {
  skillId: string;
  confidence: number;
  similarity: number;
}

export class ONNXInferenceEngine {
  private pipeline: any = null;
  private initialized: boolean = false;
  private skillEmbeddings: Map<string, number[]> = new Map();
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the inference engine (lazy loaded)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        console.log('[ONNX] Loading sentence-transformers model...');
        const start = Date.now();
        
        // Load feature extraction pipeline
        this.pipeline = await pipeline(
          'feature-extraction',
          'Xenova/all-MiniLM-L6-v2'
        );
        
        const elapsed = Date.now() - start;
        console.log(`[ONNX] Model loaded in ${elapsed}ms`);
        this.initialized = true;
      } catch (error) {
        console.error('[ONNX] Failed to load model:', error);
        throw new Error('Failed to initialize ONNX inference engine');
      }
    })();

    return this.initPromise;
  }

  /**
   * Precompute embeddings for all skills (one-time cost)
   */
  async precomputeSkillEmbeddings(skills: SkillManifest[]): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`[ONNX] Precomputing embeddings for ${skills.length} skills...`);
    const start = Date.now();

    for (const skill of skills) {
      // Create a rich text representation of the skill
      const skillText = this.buildSkillText(skill);
      const embedding = await this.computeEmbedding(skillText);
      this.skillEmbeddings.set(skill.id, embedding);
    }

    const elapsed = Date.now() - start;
    console.log(`[ONNX] Precomputed ${skills.length} embeddings in ${elapsed}ms`);
  }

  /**
   * Build a rich text representation of a skill for embedding
   */
  private buildSkillText(skill: SkillManifest): string {
    const parts = [
      skill.name,
      skill.description,
      ...skill.keywords,
      Object.keys(skill.paramSchema).join(' ')
    ];
    return parts.join(' ');
  }

  /**
   * Compute embedding for a text string
   */
  private async computeEmbedding(text: string): Promise<number[]> {
    if (!this.pipeline) {
      throw new Error('Pipeline not initialized');
    }

    const output = await this.pipeline(text, {
      pooling: 'mean',
      normalize: true
    });

    // Convert tensor to array
    return Array.from(output.data as Float32Array);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Infer intent from user prompt
   * Returns top-k most similar skills with confidence scores
   */
  async inferIntent(
    userPrompt: string,
    topK: number = 3
  ): Promise<InferenceResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.skillEmbeddings.size === 0) {
      throw new Error('Skill embeddings not precomputed. Call precomputeSkillEmbeddings() first.');
    }

    // Compute embedding for user prompt
    const promptEmbedding = await this.computeEmbedding(userPrompt);

    // Calculate similarities with all skills
    const similarities: InferenceResult[] = [];
    
    for (const [skillId, skillEmbedding] of this.skillEmbeddings.entries()) {
      const similarity = this.cosineSimilarity(promptEmbedding, skillEmbedding);
      
      // Convert similarity [-1, 1] to confidence [0, 100]
      const confidence = Math.round(((similarity + 1) / 2) * 100);
      
      similarities.push({
        skillId,
        confidence,
        similarity
      });
    }

    // Sort by similarity (descending) and return top-k
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Check if engine is ready
   */
  isReady(): boolean {
    return this.initialized && this.skillEmbeddings.size > 0;
  }

  /**
   * Get status info for debugging
   */
  getStatus(): {
    initialized: boolean;
    skillsEmbedded: number;
    modelLoaded: boolean;
  } {
    return {
      initialized: this.initialized,
      skillsEmbedded: this.skillEmbeddings.size,
      modelLoaded: this.pipeline !== null
    };
  }
}

/**
 * Singleton instance (lazy loaded)
 */
let engineInstance: ONNXInferenceEngine | null = null;

export function getONNXEngine(): ONNXInferenceEngine {
  if (!engineInstance) {
    engineInstance = new ONNXInferenceEngine();
  }
  return engineInstance;
}
