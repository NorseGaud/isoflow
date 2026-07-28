import express = require('express');
import type { NextFunction, Request, Response } from 'express';
import cors = require('cors');
import {
  createProject,
  createWorkspace,
  DEFAULT_USER_ID,
  deleteProject,
  deleteWorkspace,
  getDefaultUser,
  getProjectById,
  getProjectByName,
  getWorkspaceById,
  hasLegacyImported,
  listAllProjects,
  listCustomIcons,
  listProjectsForWorkspace,
  listWorkspacesForUser,
  parseProjectModel,
  renameProject,
  renameWorkspace,
  RevisionConflictError,
  seedDefaults,
  updateProjectModel,
  upsertCustomIcons,
  deleteCustomIcon
} from '../src/db';
import { importLegacySqliteBytes } from './importLegacy';
import { broadcastModelChanged } from './wsHub';

export const createApp = () => {
  const app = express();

  app.use(cors());

  // Must be registered before express.json() so the body stays raw bytes.
  app.post(
    '/api/import/legacy',
    express.raw({ type: '*/*', limit: '200mb' }),
    async (req, res, next) => {
      try {
        const body = req.body as Buffer | undefined;

        if (!body || !Buffer.isBuffer(body) || body.length === 0) {
          res.status(400).json({ error: 'Expected raw SQLite bytes' });
          return;
        }

        const result = await importLegacySqliteBytes(new Uint8Array(body));
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  app.use(express.json({ limit: '50mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/meta/legacy-imported', async (_req, res, next) => {
    try {
      res.json({ imported: await hasLegacyImported() });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/users/default', async (_req, res, next) => {
    try {
      await seedDefaults();
      res.json(await getDefaultUser());
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/workspaces', async (req, res, next) => {
    try {
      const userId = String(req.query.userId ?? DEFAULT_USER_ID);
      res.json(await listWorkspacesForUser(userId));
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/workspaces', async (req, res, next) => {
    try {
      const userId = String(req.body.userId ?? DEFAULT_USER_ID);
      const name = String(req.body.name ?? 'Untitled workspace');
      const workspace = await createWorkspace(userId, name);
      res.status(201).json(workspace);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/workspaces/:id', async (req, res, next) => {
    try {
      const workspace = await getWorkspaceById(req.params.id);
      if (!workspace) {
        res.status(404).json({ error: 'Workspace not found' });
        return;
      }
      res.json(workspace);
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/workspaces/:id', async (req, res, next) => {
    try {
      const name = String(req.body.name ?? '');
      const workspace = await renameWorkspace(req.params.id, name);

      if (!workspace) {
        res.status(404).json({ error: 'Workspace not found' });
        return;
      }

      res.json(workspace);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/workspaces/:id', async (req, res, next) => {
    try {
      await deleteWorkspace(req.params.id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/projects', async (req, res, next) => {
    try {
      if (req.query.workspaceId) {
        res.json(
          await listProjectsForWorkspace(String(req.query.workspaceId))
        );
        return;
      }
      res.json(await listAllProjects());
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/projects/by-name/:name', async (req, res, next) => {
    try {
      const workspaceId = req.query.workspaceId
        ? String(req.query.workspaceId)
        : undefined;
      const project = await getProjectByName(
        decodeURIComponent(req.params.name),
        workspaceId
      );

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      res.json(project);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/projects/:id', async (req, res, next) => {
    try {
      const project = await getProjectById(req.params.id);
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      res.json(project);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/projects', async (req, res, next) => {
    try {
      const workspaceId = String(req.body.workspaceId ?? '');
      const name = String(req.body.name ?? 'Untitled project');

      if (!workspaceId) {
        res.status(400).json({ error: 'workspaceId is required' });
        return;
      }

      const project = await createProject(workspaceId, name);
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/projects/:id', async (req, res, next) => {
    try {
      const name = String(req.body.name ?? '');
      const project = await renameProject(req.params.id, name);

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      res.json(project);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/projects/:id', async (req, res, next) => {
    try {
      await deleteProject(req.params.id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/projects/:id/model', async (req, res, next) => {
    try {
      const project = await getProjectById(req.params.id);
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      res.json({
        revision: project.revision,
        model: parseProjectModel(project)
      });
    } catch (error) {
      next(error);
    }
  });

  app.put('/api/projects/:id/model', async (req, res, next) => {
    try {
      const expectedRevision =
        req.body.expectedRevision === undefined
          ? undefined
          : Number(req.body.expectedRevision);
      const model = req.body.model;

      if (!model || typeof model !== 'object') {
        res.status(400).json({ error: 'model is required' });
        return;
      }

      const result = await updateProjectModel(
        req.params.id,
        model,
        Number.isFinite(expectedRevision) ? expectedRevision : undefined
      );

      broadcastModelChanged(req.params.id, result.revision, result.model);

      res.json(result);
    } catch (error) {
      if (error instanceof RevisionConflictError) {
        res.status(409).json({
          error: 'Revision conflict',
          currentRevision: error.currentRevision
        });
        return;
      }
      next(error);
    }
  });

  app.get('/api/custom-icons', async (_req, res, next) => {
    try {
      res.json(await listCustomIcons());
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/custom-icons', async (req, res, next) => {
    try {
      const icons = Array.isArray(req.body.icons) ? req.body.icons : [];
      await upsertCustomIcons(icons);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/custom-icons/:id', async (req, res, next) => {
    try {
      await deleteCustomIcon(req.params.id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.use(
    (
      error: unknown,
      _req: Request,
      res: Response,
      _next: NextFunction
    ) => {
      console.error(error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  );

  return app;
};
