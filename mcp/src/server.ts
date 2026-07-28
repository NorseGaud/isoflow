import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { CUSTOM_ICON_COLLECTION } from '../../src/config';
import type { Icon, Model } from '../../src/types';
import {
  createWorkspace,
  deleteCustomIcon,
  deleteProject,
  deleteWorkspace,
  getProjectModel,
  listCustomIcons,
  listProjects,
  listWorkspaces,
  putProjectModel,
  renameProject,
  renameWorkspace,
  upsertCustomIcons
} from './api/client';
import { compileDiagramSpec } from './compiler/compile';
import { describeModel } from './describe';
import { buildIconIndex } from './icons/index';
import { searchIcons } from './icons/match';
import { exportModelJson, importModelJson } from './importExport';
import { clearCanvas } from './ops/clearCanvas';
import { deleteEntities } from './ops/deleteEntities';
import { addGroups, updateGroups } from './ops/groups';
import { addRectangles, updateRectangles } from './ops/rectangles';
import { saveModelWithRetry } from './ops/saveModel';
import { addTextBoxes, updateTextBoxes } from './ops/textBoxes';
import { applyConnectorUpdates } from './ops/updateConnectors';
import { applyNodeUpdates } from './ops/updateNodes';
import {
  ensureProject,
  resolveProjectByName,
  resolveWorkspaceByName
} from './resolve';
import { captureProjectScreenshot } from './screenshot';
import { getAppUrl } from './config';

const textResult = (text: string) => {
  return {
    content: [{ type: 'text' as const, text }]
  };
};

const nodeSchema = z.object({
  key: z.string(),
  label: z.string(),
  icon: z.string().optional(),
  description: z.string().optional(),
  group: z.string().optional()
});

const edgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  style: z.enum(['SOLID', 'DOTTED', 'DASHED']).optional(),
  label: z.string().optional(),
  labelEmphasis: z.enum(['SUBTLE', 'CHIP', 'CAPS']).optional()
});

const groupSchema = z.object({
  key: z.string(),
  label: z.string().optional(),
  color: z.string().optional()
});

const requireConfirm = (confirm: boolean | undefined, action: string) => {
  if (!confirm) {
    throw new Error(`${action} requires confirm: true`);
  }
};

const createServer = () => {
  buildIconIndex();

  const server = new McpServer({
    name: 'isoflow',
    version: '1.0.0'
  });

  server.registerTool(
    'isoflow_list_workspaces',
    {
      description: 'List Isoflow workspaces (name and id).'
    },
    async () => {
      const workspaces = await listWorkspaces();
      const lines = workspaces.map((workspace) => {
        return `- ${workspace.name} (id=${workspace.id})`;
      });
      return textResult(
        lines.length > 0 ? lines.join('\n') : 'No workspaces found.'
      );
    }
  );

  server.registerTool(
    'isoflow_create_workspace',
    {
      description: 'Create a workspace by name.',
      inputSchema: { name: z.string() }
    },
    async ({ name }) => {
      const workspace = await createWorkspace(name);
      return textResult(
        `Created workspace "${workspace.name}" (id=${workspace.id}).`
      );
    }
  );

  server.registerTool(
    'isoflow_rename_workspace',
    {
      description: 'Rename a workspace by current name.',
      inputSchema: {
        workspaceName: z.string(),
        newName: z.string()
      }
    },
    async ({ workspaceName, newName }) => {
      const workspace = await resolveWorkspaceByName(workspaceName);
      const renamed = await renameWorkspace(workspace.id, newName);
      return textResult(
        `Renamed workspace "${workspaceName}" → "${renamed.name}" (id=${renamed.id}).`
      );
    }
  );

  server.registerTool(
    'isoflow_delete_workspace',
    {
      description: 'Delete a workspace by name. Requires confirm: true.',
      inputSchema: {
        workspaceName: z.string(),
        confirm: z.boolean()
      }
    },
    async ({ workspaceName, confirm }) => {
      requireConfirm(confirm, 'isoflow_delete_workspace');
      const workspace = await resolveWorkspaceByName(workspaceName);
      await deleteWorkspace(workspace.id);
      return textResult(`Deleted workspace "${workspaceName}".`);
    }
  );

  server.registerTool(
    'isoflow_list_projects',
    {
      description:
        'List Isoflow projects. Optional workspaceName filters to one workspace.',
      inputSchema: {
        workspaceName: z.string().optional()
      }
    },
    async (args) => {
      const workspaceName = args?.workspaceName;
      const workspace = workspaceName
        ? await resolveWorkspaceByName(workspaceName)
        : undefined;
      const projects = await listProjects(workspace?.id);
      const lines = projects.map((project) => {
        return `- ${project.name} (id=${project.id}, workspaceId=${project.workspaceId}, revision=${project.revision})`;
      });
      return textResult(
        lines.length > 0 ? lines.join('\n') : 'No projects found.'
      );
    }
  );

  server.registerTool(
    'isoflow_create_project',
    {
      description:
        'Create a project by name. Optional workspaceName (defaults to first workspace).',
      inputSchema: {
        projectName: z.string(),
        workspaceName: z.string().optional()
      }
    },
    async ({ projectName, workspaceName }) => {
      const project = await ensureProject(projectName, workspaceName);
      return textResult(
        `Project ready "${project.name}" (id=${project.id}, revision=${project.revision}).`
      );
    }
  );

  server.registerTool(
    'isoflow_rename_project',
    {
      description:
        'Rename a project by name (also syncs model title). Optional workspaceName.',
      inputSchema: {
        projectName: z.string(),
        newName: z.string(),
        workspaceName: z.string().optional()
      }
    },
    async ({ projectName, newName, workspaceName }) => {
      const project = await resolveProjectByName(projectName, workspaceName);
      const renamed = await renameProject(project.id, newName);
      return textResult(
        `Renamed project "${projectName}" → "${renamed.name}" (id=${renamed.id}).`
      );
    }
  );

  server.registerTool(
    'isoflow_delete_project',
    {
      description: 'Delete a project by name. Requires confirm: true.',
      inputSchema: {
        projectName: z.string(),
        workspaceName: z.string().optional(),
        confirm: z.boolean()
      }
    },
    async ({ projectName, workspaceName, confirm }) => {
      requireConfirm(confirm, 'isoflow_delete_project');
      const project = await resolveProjectByName(projectName, workspaceName);
      await deleteProject(project.id);
      return textResult(`Deleted project "${projectName}".`);
    }
  );

  server.registerTool(
    'isoflow_search_icons',
    {
      description:
        'Search Isoflow icon packs by free-text query. Returns id/name/collection only (no URLs).',
      inputSchema: {
        query: z.string(),
        limit: z.number().int().min(1).max(50).optional(),
        collection: z.string().optional()
      }
    },
    async ({ query, limit, collection }) => {
      const matches = searchIcons(query, limit ?? 10, collection);
      return textResult(
        matches.length === 0
          ? `No icons matched "${query}".`
          : matches
              .map((match) => {
                return `${match.score}\t${match.id}\t${match.name}\t${match.collection}\t${match.reason}`;
              })
              .join('\n')
      );
    }
  );

  server.registerTool(
    'isoflow_apply_diagram',
    {
      description:
        'Create or update a diagram from a semantic spec (nodes/edges/groups). Resolves icons, lays out tiles, validates, and saves. Targets projects by name (creates if missing). Preserves manual positions for existing node keys.',
      inputSchema: {
        projectName: z.string(),
        workspaceName: z.string().optional(),
        title: z.string().optional(),
        nodes: z.array(nodeSchema).min(1),
        edges: z.array(edgeSchema).optional(),
        groups: z.array(groupSchema).optional()
      }
    },
    async ({ projectName, workspaceName, title, nodes, edges, groups }) => {
      const project = await ensureProject(projectName, workspaceName);
      const current = await getProjectModel(project.id);
      const compiled = compileDiagramSpec(
        { projectName, title, nodes, edges, groups },
        current.model
      );
      const saved = await putProjectModel(
        project.id,
        compiled,
        current.revision
      );

      return textResult(
        [
          `Applied diagram to project "${project.name}" (id=${project.id}).`,
          `Revision: ${saved.revision}`,
          '',
          describeModel(saved.model)
        ].join('\n')
      );
    }
  );

  server.registerTool(
    'isoflow_describe_diagram',
    {
      description:
        'Describe a project diagram as compact text (never returns raw Model JSON or icon URLs).',
      inputSchema: {
        projectName: z.string(),
        workspaceName: z.string().optional()
      }
    },
    async ({ projectName, workspaceName }) => {
      const project = await resolveProjectByName(projectName, workspaceName);
      const { model, revision } = await getProjectModel(project.id);
      return textResult(
        `Project "${project.name}" revision ${revision}\n\n${describeModel(model)}`
      );
    }
  );

  server.registerTool(
    'isoflow_add_nodes',
    {
      description:
        'Add nodes to an existing project diagram without replacing the whole graph.',
      inputSchema: {
        projectName: z.string(),
        workspaceName: z.string().optional(),
        nodes: z.array(nodeSchema).min(1)
      }
    },
    async ({ projectName, workspaceName, nodes }) => {
      const project = await ensureProject(projectName, workspaceName);
      const current = await getProjectModel(project.id);
      const existingKeys = new Set(
        current.model.items.map((item) => item.id)
      );

      const mergedNodes = [
        ...current.model.items.map((item) => {
          return {
            key: item.id,
            label: item.name,
            icon: item.icon,
            description: item.description
          };
        }),
        ...nodes.filter((node) => !existingKeys.has(node.key))
      ];

      const existingEdges =
        current.model.views[0]?.connectors?.flatMap((connector) => {
          const from = connector.anchors[0]?.ref.item;
          const to = connector.anchors[connector.anchors.length - 1]?.ref.item;
          if (!from || !to) return [];
          return [
            {
              from,
              to,
              style: connector.style,
              label: connector.description,
              labelEmphasis: connector.labelEmphasis
            }
          ];
        }) ?? [];

      const compiled = compileDiagramSpec(
        {
          projectName,
          title: current.model.title,
          nodes: mergedNodes,
          edges: existingEdges
        },
        current.model
      );

      const saved = await putProjectModel(
        project.id,
        compiled,
        current.revision
      );

      return textResult(
        `Added nodes. Revision ${saved.revision}\n\n${describeModel(saved.model)}`
      );
    }
  );

  server.registerTool(
    'isoflow_update_nodes',
    {
      description:
        'Update node properties (label, description, icon, showLabel, labelHeight, rotation).',
      inputSchema: {
        projectName: z.string(),
        workspaceName: z.string().optional(),
        updates: z
          .array(
            z.object({
              key: z.string(),
              label: z.string().optional(),
              description: z.string().optional(),
              icon: z.string().optional(),
              showLabel: z.boolean().optional(),
              labelHeight: z.number().optional(),
              rotation: z.number().optional()
            })
          )
          .min(1)
      }
    },
    async ({ projectName, workspaceName, updates }) => {
      const project = await resolveProjectByName(projectName, workspaceName);
      const saved = await saveModelWithRetry(project.id, (model) => {
        return applyNodeUpdates(model, updates);
      });
      return textResult(
        `Updated nodes. Revision ${saved.revision}\n\n${describeModel(saved.model)}`
      );
    }
  );

  server.registerTool(
    'isoflow_connect',
    {
      description: 'Add connectors between existing nodes by key.',
      inputSchema: {
        projectName: z.string(),
        workspaceName: z.string().optional(),
        edges: z.array(edgeSchema).min(1)
      }
    },
    async ({ projectName, workspaceName, edges }) => {
      const project = await resolveProjectByName(projectName, workspaceName);
      const saved = await saveModelWithRetry(project.id, (current) => {
        const view = current.views[0];
        if (!view) throw new Error('Project has no view');

        const existing =
          view.connectors?.map((connector) => {
            return { ...connector };
          }) ?? [];

        edges.forEach((edge, index) => {
          existing.push({
            id: `conn-extra-${Date.now()}-${index}`,
            description: edge.label,
            style: edge.style,
            labelEmphasis: edge.labelEmphasis,
            color: current.colors[0]?.id,
            anchors: [
              { id: `ae-${index}-a`, ref: { item: edge.from } },
              { id: `ae-${index}-b`, ref: { item: edge.to } }
            ]
          });
        });

        const nextModel: Model = {
          ...current,
          views: [{ ...view, connectors: existing }]
        };
        return nextModel;
      });

      return textResult(
        `Connected nodes. Revision ${saved.revision}\n\n${describeModel(saved.model)}`
      );
    }
  );

  server.registerTool(
    'isoflow_update_connectors',
    {
      description:
        'Update connector style, color, width, label, or labelEmphasis.',
      inputSchema: {
        projectName: z.string(),
        workspaceName: z.string().optional(),
        updates: z
          .array(
            z.object({
              id: z.string(),
              style: z.enum(['SOLID', 'DOTTED', 'DASHED']).optional(),
              color: z.string().optional(),
              width: z.number().optional(),
              label: z.string().optional(),
              labelEmphasis: z.enum(['SUBTLE', 'CHIP', 'CAPS']).optional()
            })
          )
          .min(1)
      }
    },
    async ({ projectName, workspaceName, updates }) => {
      const project = await resolveProjectByName(projectName, workspaceName);
      const saved = await saveModelWithRetry(project.id, (model) => {
        return applyConnectorUpdates(model, updates);
      });
      return textResult(
        `Updated connectors. Revision ${saved.revision}\n\n${describeModel(saved.model)}`
      );
    }
  );

  server.registerTool(
    'isoflow_move_nodes',
    {
      description: 'Move nodes to explicit tile coordinates.',
      inputSchema: {
        projectName: z.string(),
        workspaceName: z.string().optional(),
        moves: z
          .array(
            z.object({
              key: z.string(),
              x: z.number(),
              y: z.number()
            })
          )
          .min(1)
      }
    },
    async ({ projectName, workspaceName, moves }) => {
      const project = await resolveProjectByName(projectName, workspaceName);
      const saved = await saveModelWithRetry(project.id, (current) => {
        const view = current.views[0];
        if (!view) throw new Error('Project has no view');
        const moveMap = new Map(
          moves.map((move) => {
            return [move.key, { x: move.x, y: move.y }] as const;
          })
        );
        return {
          ...current,
          views: [
            {
              ...view,
              items: view.items.map((item) => {
                const tile = moveMap.get(item.id);
                return tile ? { ...item, tile } : item;
              })
            }
          ]
        };
      });

      return textResult(
        `Moved nodes. Revision ${saved.revision}\n\n${describeModel(saved.model)}`
      );
    }
  );

  server.registerTool(
    'isoflow_add_rectangles',
    {
      description: 'Add rectangle regions to a diagram.',
      inputSchema: {
        projectName: z.string(),
        workspaceName: z.string().optional(),
        rectangles: z
          .array(
            z.object({
              key: z.string().optional(),
              from: z.object({ x: z.number(), y: z.number() }),
              to: z.object({ x: z.number(), y: z.number() }),
              color: z.string().optional()
            })
          )
          .min(1)
      }
    },
    async ({ projectName, workspaceName, rectangles }) => {
      const project = await resolveProjectByName(projectName, workspaceName);
      const saved = await saveModelWithRetry(project.id, (model) => {
        return addRectangles(model, rectangles);
      });
      return textResult(
        `Added rectangles. Revision ${saved.revision}\n\n${describeModel(saved.model)}`
      );
    }
  );

  server.registerTool(
    'isoflow_update_rectangles',
    {
      description: 'Update rectangle position/size/color by key.',
      inputSchema: {
        projectName: z.string(),
        workspaceName: z.string().optional(),
        updates: z
          .array(
            z.object({
              key: z.string(),
              from: z.object({ x: z.number(), y: z.number() }).optional(),
              to: z.object({ x: z.number(), y: z.number() }).optional(),
              color: z.string().optional()
            })
          )
          .min(1)
      }
    },
    async ({ projectName, workspaceName, updates }) => {
      const project = await resolveProjectByName(projectName, workspaceName);
      const saved = await saveModelWithRetry(project.id, (model) => {
        return updateRectangles(model, updates);
      });
      return textResult(
        `Updated rectangles. Revision ${saved.revision}\n\n${describeModel(saved.model)}`
      );
    }
  );

  server.registerTool(
    'isoflow_add_groups',
    {
      description:
        'Add named groups of nodes. Connectors between members are inferred automatically.',
      inputSchema: {
        projectName: z.string(),
        workspaceName: z.string().optional(),
        groups: z
          .array(
            z.object({
              key: z.string().optional(),
              name: z.string(),
              color: z.string().optional(),
              memberKeys: z.array(z.string()).min(1)
            })
          )
          .min(1)
      }
    },
    async ({ projectName, workspaceName, groups }) => {
      const project = await resolveProjectByName(projectName, workspaceName);
      const saved = await saveModelWithRetry(project.id, (model) => {
        return addGroups(model, groups);
      });
      return textResult(
        `Added groups. Revision ${saved.revision}\n\n${describeModel(saved.model)}`
      );
    }
  );

  server.registerTool(
    'isoflow_update_groups',
    {
      description:
        'Update groups by key (name, color, addMembers/removeMembers/setMembers).',
      inputSchema: {
        projectName: z.string(),
        workspaceName: z.string().optional(),
        updates: z
          .array(
            z.object({
              key: z.string(),
              name: z.string().optional(),
              color: z.string().optional(),
              addMembers: z.array(z.string()).optional(),
              removeMembers: z.array(z.string()).optional(),
              setMembers: z.array(z.string()).optional()
            })
          )
          .min(1)
      }
    },
    async ({ projectName, workspaceName, updates }) => {
      const project = await resolveProjectByName(projectName, workspaceName);
      const saved = await saveModelWithRetry(project.id, (model) => {
        return updateGroups(model, updates);
      });
      return textResult(
        `Updated groups. Revision ${saved.revision}\n\n${describeModel(saved.model)}`
      );
    }
  );

  server.registerTool(
    'isoflow_add_text_boxes',
    {
      description: 'Add text boxes to a diagram.',
      inputSchema: {
        projectName: z.string(),
        workspaceName: z.string().optional(),
        textBoxes: z
          .array(
            z.object({
              key: z.string().optional(),
              content: z.string(),
              x: z.number(),
              y: z.number(),
              fontSize: z.number().optional(),
              orientation: z.enum(['X', 'Y']).optional()
            })
          )
          .min(1)
      }
    },
    async ({ projectName, workspaceName, textBoxes }) => {
      const project = await resolveProjectByName(projectName, workspaceName);
      const saved = await saveModelWithRetry(project.id, (model) => {
        return addTextBoxes(model, textBoxes);
      });
      return textResult(
        `Added text boxes. Revision ${saved.revision}\n\n${describeModel(saved.model)}`
      );
    }
  );

  server.registerTool(
    'isoflow_update_text_boxes',
    {
      description: 'Update text box content, position, or font.',
      inputSchema: {
        projectName: z.string(),
        workspaceName: z.string().optional(),
        updates: z
          .array(
            z.object({
              key: z.string(),
              content: z.string().optional(),
              x: z.number().optional(),
              y: z.number().optional(),
              fontSize: z.number().optional(),
              orientation: z.enum(['X', 'Y']).optional()
            })
          )
          .min(1)
      }
    },
    async ({ projectName, workspaceName, updates }) => {
      const project = await resolveProjectByName(projectName, workspaceName);
      const saved = await saveModelWithRetry(project.id, (model) => {
        return updateTextBoxes(model, updates);
      });
      return textResult(
        `Updated text boxes. Revision ${saved.revision}\n\n${describeModel(saved.model)}`
      );
    }
  );

  server.registerTool(
    'isoflow_delete',
    {
      description:
        'Delete nodes (and their connectors), connectors, rectangles, groups, and/or text boxes by key/id.',
      inputSchema: {
        projectName: z.string(),
        workspaceName: z.string().optional(),
        nodeKeys: z.array(z.string()).optional(),
        connectorIds: z.array(z.string()).optional(),
        rectangleKeys: z.array(z.string()).optional(),
        groupKeys: z.array(z.string()).optional(),
        textBoxKeys: z.array(z.string()).optional()
      }
    },
    async ({
      projectName,
      workspaceName,
      nodeKeys,
      connectorIds,
      rectangleKeys,
      groupKeys,
      textBoxKeys
    }) => {
      const project = await resolveProjectByName(projectName, workspaceName);
      const saved = await saveModelWithRetry(project.id, (model) => {
        return deleteEntities(model, {
          nodeKeys,
          connectorIds,
          rectangleKeys,
          groupKeys,
          textBoxKeys
        });
      });
      return textResult(
        `Deleted. Revision ${saved.revision}\n\n${describeModel(saved.model)}`
      );
    }
  );

  server.registerTool(
    'isoflow_clear_canvas',
    {
      description:
        'Clear all nodes, connectors, rectangles, groups, and text boxes. Requires confirm: true.',
      inputSchema: {
        projectName: z.string(),
        workspaceName: z.string().optional(),
        confirm: z.boolean()
      }
    },
    async ({ projectName, workspaceName, confirm }) => {
      requireConfirm(confirm, 'isoflow_clear_canvas');
      const project = await resolveProjectByName(projectName, workspaceName);
      const saved = await saveModelWithRetry(project.id, clearCanvas);
      return textResult(
        `Cleared canvas. Revision ${saved.revision}\n\n${describeModel(saved.model)}`
      );
    }
  );

  server.registerTool(
    'isoflow_list_custom_icons',
    {
      description: 'List custom icons (id and name only).'
    },
    async () => {
      const icons = await listCustomIcons();
      const lines = icons.map((icon) => {
        return `- ${icon.id}: ${icon.name}`;
      });
      return textResult(
        lines.length > 0 ? lines.join('\n') : 'No custom icons.'
      );
    }
  );

  server.registerTool(
    'isoflow_add_custom_icon',
    {
      description: 'Add a custom icon by name and url (or data URI).',
      inputSchema: {
        id: z.string().optional(),
        name: z.string(),
        url: z.string()
      }
    },
    async ({ id, name, url }) => {
      const icon: Icon = {
        id: id?.trim() || `custom-${Date.now()}`,
        name,
        url,
        collection: CUSTOM_ICON_COLLECTION,
        isIsometric: false
      };
      await upsertCustomIcons([icon]);
      return textResult(`Added custom icon "${icon.name}" (id=${icon.id}).`);
    }
  );

  server.registerTool(
    'isoflow_delete_custom_icon',
    {
      description: 'Delete a custom icon by id (or exact name if unique).',
      inputSchema: {
        idOrName: z.string()
      }
    },
    async ({ idOrName }) => {
      const icons = await listCustomIcons();
      const byId = icons.find((icon) => icon.id === idOrName);
      const byName = icons.filter((icon) => icon.name === idOrName);
      const icon =
        byId ??
        (byName.length === 1
          ? byName[0]
          : byName.length > 1
            ? null
            : undefined);

      if (byName.length > 1 && !byId) {
        throw new Error(
          `Ambiguous custom icon name "${idOrName}" (ids: ${byName
            .map((entry) => entry.id)
            .join(', ')})`
        );
      }

      if (!icon) {
        throw new Error(`Custom icon not found: "${idOrName}"`);
      }

      await deleteCustomIcon(icon.id);
      return textResult(`Deleted custom icon "${icon.name}" (id=${icon.id}).`);
    }
  );

  server.registerTool(
    'isoflow_export_json',
    {
      description:
        'Export a project model as JSON with isopack icons stripped (no URL bloat).',
      inputSchema: {
        projectName: z.string(),
        workspaceName: z.string().optional()
      }
    },
    async ({ projectName, workspaceName }) => {
      const project = await resolveProjectByName(projectName, workspaceName);
      const { model, revision } = await getProjectModel(project.id);
      return textResult(
        `Project "${project.name}" revision ${revision}\n\n${exportModelJson(model)}`
      );
    }
  );

  server.registerTool(
    'isoflow_import_json',
    {
      description:
        'Import model JSON into a project by name (creates if missing). Validates and rehydrates isopacks.',
      inputSchema: {
        projectName: z.string(),
        workspaceName: z.string().optional(),
        json: z.string()
      }
    },
    async ({ projectName, workspaceName, json }) => {
      const project = await ensureProject(projectName, workspaceName);
      const imported = importModelJson(json);
      const saved = await saveModelWithRetry(project.id, () => imported);
      return textResult(
        `Imported into "${project.name}". Revision ${saved.revision}\n\n${describeModel(saved.model)}`
      );
    }
  );

  server.registerTool(
    'isoflow_screenshot',
    {
      description:
        'Capture a PNG of the project canvas via headless browser against ISOFLOW_APP_URL. Writes a file and returns its absolute path (does not return image bytes). Requires the web app to be reachable.',
      inputSchema: {
        projectName: z.string(),
        workspaceName: z.string().optional(),
        savePath: z.string().optional(),
        width: z.number().int().min(400).max(4000).optional(),
        height: z.number().int().min(400).max(4000).optional()
      }
    },
    async ({ projectName, workspaceName, savePath, width, height }) => {
      const project = await resolveProjectByName(projectName, workspaceName);
      const outPath = await captureProjectScreenshot({
        workspaceId: project.workspaceId,
        projectId: project.id,
        projectName: project.name,
        savePath,
        width,
        height
      });
      return textResult(
        [
          `Screenshot saved: ${outPath}`,
          `Project: "${project.name}" (id=${project.id})`,
          `App: ${getAppUrl()}`
        ].join('\n')
      );
    }
  );

  return server;
};

const main = async () => {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
};

const invokedAs = process.argv[1] ? require('path').resolve(process.argv[1]) : '';
const thisFile = typeof __filename !== 'undefined' ? __filename : '';
const isDirectRun =
  (typeof require !== 'undefined' && require.main === module) ||
  (invokedAs !== '' &&
    thisFile !== '' &&
    (invokedAs === thisFile ||
      invokedAs.endsWith('/mcp/src/server.ts') ||
      invokedAs.endsWith('/mcp/src/server.js')));

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { createServer };
