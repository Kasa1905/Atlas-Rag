import type { Document, CreateDocumentInput, UpdateDocumentInput } from '@atlas/shared';
export declare function createDocument(input: CreateDocumentInput): Document;
export declare function getDocument(id: string): Document | null;
export declare function listDocumentsByProject(projectId: string): Document[];
export declare function updateDocument(id: string, input: UpdateDocumentInput): Document | null;
export declare function deleteDocument(id: string): boolean;
//# sourceMappingURL=documents.d.ts.map