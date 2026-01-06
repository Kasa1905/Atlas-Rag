import { Router } from 'express';
import type { Request, Response } from 'express';
import * as projectService from '../services/projectService';
import { watchProjectDirectory, stopWatching } from '../services/watcherService';
import type { CreateProjectInput, UpdateProjectInput } from '@atlas/shared';

const router = Router();

// GET /api/projects - List all projects
router.get('/', async (req: Request, res: Response) => {
  try {
    const projects = projectService.getAllProjects();
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id - Get single project
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const project = projectService.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch project' });
  }
});

// POST /api/projects - Create new project
router.post('/', async (req: Request, res: Response) => {
  try {
    const input: CreateProjectInput = req.body;
    const project = projectService.createNewProject(input);
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create project' });
  }
});

// PATCH /api/projects/:id - Update project
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const input: UpdateProjectInput = req.body;
    const project = projectService.updateExistingProject(req.params.id, input);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // Stop watcher if active
    await stopWatching(req.params.id);
    
    const success = projectService.deleteExistingProject(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete project' });
  }
});

// POST /api/projects/:id/watch - Start watching directory
router.post('/:id/watch', async (req: Request, res: Response) => {
  try {
    const { directoryPath } = req.body;
  
    if (!directoryPath) {
      return res.status(400).json({ success: false, error: 'directoryPath is required' });
    }
  
    watchProjectDirectory(req.params.id, directoryPath);
  
    // Update project settings with watched directory
    const project = projectService.updateExistingProject(req.params.id, {
      settings: { watchedDirectory: directoryPath },
    });
  
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to start watching directory' });
  }
});

// DELETE /api/projects/:id/watch - Stop watching directory
router.delete('/:id/watch', async (req: Request, res: Response) => {
  try {
    await stopWatching(req.params.id);
  
    // Remove watched directory from settings
    const project = projectService.updateExistingProject(req.params.id, {
      settings: { watchedDirectory: undefined },
    });
  
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to stop watching directory' });
  }
});

export default router;
