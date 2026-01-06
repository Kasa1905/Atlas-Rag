export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  settings?: ProjectSettings;
}

export interface ProjectSettings {
  chunkSize: number;
  chunkOverlap: number;
  embeddingModel: string;
  chatModel: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  settings?: Partial<ProjectSettings>;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  settings?: Partial<ProjectSettings>;
}
