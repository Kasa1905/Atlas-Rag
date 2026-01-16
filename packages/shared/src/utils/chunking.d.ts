export interface ChunkOptions {
    chunkSize: number;
    chunkOverlap: number;
    preserveWords?: boolean;
}
export interface TextChunk {
    content: string;
    startChar: number;
    endChar: number;
}
/**
 * Split text into overlapping chunks using a sliding window algorithm
 */
export declare function chunkText(text: string, options: ChunkOptions): TextChunk[];
/**
 * Advanced chunking for code that attempts to preserve function/class boundaries
 */
export declare function chunkCode(code: string, options: ChunkOptions): TextChunk[];
//# sourceMappingURL=chunking.d.ts.map