import type { Chunk, Embedding, CreateChunkInput, CreateEmbeddingInput } from '@atlas/shared';
export declare function createChunk(input: CreateChunkInput): Chunk;
export declare function getChunk(id: string): Chunk | null;
export declare function listChunksByDocument(documentId: string): Chunk[];
export declare function createEmbedding(input: CreateEmbeddingInput): Embedding;
export declare function getEmbeddingByChunk(chunkId: string): Embedding | null;
export declare function deleteChunk(id: string): boolean;
export declare function deleteChunksByDocument(documentId: string): boolean;
export declare function getChunksWithoutEmbeddings(documentId: string): Chunk[];
export declare function getChunksWithoutEmbeddingsByProject(projectId: string): Chunk[];
export declare function countEmbeddingsByDocument(documentId: string): number;
export declare function countEmbeddingsByProject(projectId: string): number;
export declare function getAllEmbeddingsByProject(projectId: string): Array<{
    chunkId: string;
    embedding: number[];
}>;
export declare function deleteEmbeddingsByDocument(documentId: string): boolean;
//# sourceMappingURL=chunks.d.ts.map