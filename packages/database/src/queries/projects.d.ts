import type { Project, CreateProjectInput, UpdateProjectInput } from '@atlas/shared';
export declare function createProject(input: CreateProjectInput): Project;
export declare function getProject(id: string): Project | null;
export declare function listProjects(): Project[];
export declare function updateProject(id: string, input: UpdateProjectInput): Project | null;
export declare function deleteProject(id: string): boolean;
//# sourceMappingURL=projects.d.ts.map