import {
  createProject,
  getProject,
  listProjects,
  updateProject,
  deleteProject,
} from '@atlas/database';
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
} from '@atlas/shared';

export function getAllProjects(): Project[] {
  return listProjects();
}

export function getProjectById(id: string): Project | null {
  return getProject(id);
}

export function createNewProject(input: CreateProjectInput): Project {
  return createProject(input);
}

export function updateExistingProject(
  id: string,
  input: UpdateProjectInput
): Project | null {
  return updateProject(id, input);
}

export function deleteExistingProject(id: string): boolean {
  return deleteProject(id);
}
