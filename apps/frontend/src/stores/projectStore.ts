import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Project, Document } from '@atlas/shared';
import { api } from '../services/api';

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
    documents: Record<string, Document[]>;
  isLoading: boolean;
  error: string | null;
  
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
    fetchProject: (id: string) => Promise<void>;
    fetchDocuments: (projectId: string) => Promise<void>;
    addDocument: (document: Document) => void;
    updateDocument: (id: string, updates: Partial<Document>) => void;
    deleteDocument: (id: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProjectStore = create<ProjectStore>()(
  devtools(
    (set) => ({
      projects: [],
      currentProject: null,
        documents: {},
      isLoading: false,
      error: null,

      setProjects: (projects) => set({ projects }),
      
      setCurrentProject: (project) => set({ currentProject: project }),
      
      addProject: (project) =>
        set((state) => ({ projects: [project, ...state.projects] })),
      
      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
          currentProject:
            state.currentProject?.id === id
              ? { ...state.currentProject, ...updates }
              : state.currentProject,
        })),
      
      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject:
            state.currentProject?.id === id ? null : state.currentProject,

              fetchProject: async (id: string) => {
                set({ isLoading: true, error: null });
                try {
                  const response = await api.get<Project>(`/api/projects/${id}`);
                  if (response.success && response.data) {
                    set({ currentProject: response.data, isLoading: false });
                  } else {
                    set({ error: 'Failed to fetch project', isLoading: false });
                  }
                } catch (error) {
                  set({ error: 'Failed to fetch project', isLoading: false });
                }
              },

              fetchDocuments: async (projectId: string) => {
                try {
                  const response = await api.get<Document[]>(`/api/documents?projectId=${projectId}`);
                  if (response.success && response.data) {
                    set((state) => ({
                      documents: { ...state.documents, [projectId]: response.data! },
                    }));
                  }
                } catch (error) {
                  console.error('Failed to fetch documents:', error);
                }
              },

              addDocument: (document: Document) =>
                set((state) => ({
                  documents: {
                    ...state.documents,
                    [document.projectId]: [
                      document,
                      ...(state.documents[document.projectId] || []),
                    ],
                  },
                })),

              updateDocument: (id: string, updates: Partial<Document>) =>
                set((state) => {
                  const newDocuments = { ...state.documents };
                  for (const projectId in newDocuments) {
                    newDocuments[projectId] = newDocuments[projectId].map((doc) =>
                      doc.id === id ? { ...doc, ...updates } : doc
                    );
                  }
                  return { documents: newDocuments };
                }),

              deleteDocument: async (id: string) => {
                try {
                  const response = await api.delete(`/api/documents/${id}`);
                  if (response.success) {
                    set((state) => {
                      const newDocuments = { ...state.documents };
                      for (const projectId in newDocuments) {
                        newDocuments[projectId] = newDocuments[projectId].filter(
                          (doc) => doc.id !== id
                        );
                      }
                      return { documents: newDocuments };
                    });
                  }
                } catch (error) {
                  console.error('Failed to delete document:', error);
                }
              },
        })),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
    }),
    { name: 'project-store' }
  )
);
