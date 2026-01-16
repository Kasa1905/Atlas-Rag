export interface Document {
    id: string;
    projectId: string;
    name: string;
    filePath: string;
    fileType: DocumentFileType;
    fileSize?: number;
    status: DocumentStatus;
    createdAt: number;
    updatedAt: number;
    metadata?: {
        pageCount?: number;
        chunkCount?: number;
        embeddingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
        embeddingProgress?: {
            total: number;
            completed: number;
            failed: number;
        };
        embeddingError?: string;
        [key: string]: any;
    };
    errorMessage?: string;
}
export type DocumentFileType = 'pdf' | 'code' | 'markdown' | 'text';
export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';
export interface CreateDocumentInput {
    projectId: string;
    name: string;
    filePath: string;
    fileType: DocumentFileType;
    fileSize?: number;
    metadata?: Record<string, any>;
}
export interface UpdateDocumentInput {
    name?: string;
    status?: DocumentStatus;
    metadata?: Record<string, any>;
    errorMessage?: string;
}
//# sourceMappingURL=document.d.ts.map