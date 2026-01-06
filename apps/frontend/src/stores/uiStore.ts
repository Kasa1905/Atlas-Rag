import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UIStore {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set) => ({
        sidebarOpen: true,
        theme: 'light',

        toggleSidebar: () =>
          set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        
        setTheme: (theme) => set({ theme }),
      }),
      {
        name: 'ui-store',
      }
    ),
    { name: 'ui-store' }
  )
);
