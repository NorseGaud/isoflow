import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  ensureProject,
  getProjectModel,
  listProjects,
  putProjectModel
} from './api/client';
import { compileDiagramSpec } from './compiler/compile';
import { describeModel } from './describe';
import { searchIcons } from './icons/match';
import { buildIconIndex } from './icons/index';
import type { Model } from '../../src/types';

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
  label: z.string().optional()
});

const groupSchema = z.object({
  key: z.string(),
  label: z.string().optional(),
  color: z.string().optional()
});

const createServer = () => {
  // Warm icon index at startup so first tool call is fast.
  buildIconIndex();

  const server = new McpServer({
    name: 'isoflow',
    version: '1.0.0'
  });

  server.registerTool(
    'isoflow_list_projects',
    {
      description: 'List Isoflow projects available on the local server.'
    },
    async () => {
      const projects = await listProjects();
      const lines = projects.map((project) => {
        return `- ${project.name} (id=${project.id}, revision=${project.revision})`;
      });
      return textResult(
        lines.length > 0 ? lines.join('\n') : 'No projects found.'
      );
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
        title: z.string().optional(),
        nodes: z.array(nodeSchema).min(1),
        edges: z.array(edgeSchema).optional(),
        groups: z.array(groupSchema).optional()
      }
    },
    async ({ projectName, title, nodes, edges, groups }) => {
      const project = await ensureProject(projectName);
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
        projectName: z.string()
      }
    },
    async ({ projectName }) => {
      const project = await ensureProject(projectName);
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
        nodes: z.array(nodeSchema).min(1)
      }
    },
    async ({ projectName, nodes }) => {
      const project = await ensureProject(projectName);
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
              label: connector.description
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
    'isoflow_connect',
    {
      description: 'Add connectors between existing nodes by key.',
      inputSchema: {
        projectName: z.string(),
        edges: z.array(edgeSchema).min(1)
      }
    },
    async ({ projectName, edges }) => {
      const project = await ensureProject(projectName);
      const current = await getProjectModel(project.id);
      const view = current.model.views[0];

      if (!view) {
        throw new Error('Project has no view');
      }

      const existing =
        view.connectors?.map((connector) => {
          return { ...connector };
        }) ?? [];

      edges.forEach((edge, index) => {
        existing.push({
          id: `conn-extra-${Date.now()}-${index}`,
          description: edge.label,
          style: edge.style,
          color: current.model.colors[0]?.id,
          anchors: [
            { id: `ae-${index}-a`, ref: { item: edge.from } },
            { id: `ae-${index}-b`, ref: { item: edge.to } }
          ]
        });
      });

      const nextModel: Model = {
        ...current.model,
        views: [
          {
            ...view,
            connectors: existing
          }
        ]
      };

      const saved = await putProjectModel(
        project.id,
        nextModel,
        current.revision
      );

      return textResult(
        `Connected nodes. Revision ${saved.revision}\n\n${describeModel(saved.model)}`
      );
    }
  );

  server.registerTool(
    'isoflow_move_nodes',
    {
      description: 'Move nodes to explicit tile coordinates.',
      inputSchema: {
        projectName: z.string(),
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
    async ({ projectName, moves }) => {
      const project = await ensureProject(projectName);
      const current = await getProjectModel(project.id);
      const view = current.model.views[0];

      if (!view) {
        throw new Error('Project has no view');
      }

      const moveMap = new Map(
        moves.map((move) => {
          return [move.key, { x: move.x, y: move.y }] as const;
        })
      );

      const nextModel: Model = {
        ...current.model,
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

      const saved = await putProjectModel(
        project.id,
        nextModel,
        current.revision
      );

      return textResult(
        `Moved nodes. Revision ${saved.revision}\n\n${describeModel(saved.model)}`
      );
    }
  );

  server.registerTool(
    'isoflow_delete',
    {
      description: 'Delete nodes (and their connectors) and/or connectors by id.',
      inputSchema: {
        projectName: z.string(),
        nodeKeys: z.array(z.string()).optional(),
        connectorIds: z.array(z.string()).optional()
      }
    },
    async ({ projectName, nodeKeys, connectorIds }) => {
      const project = await ensureProject(projectName);
      const current = await getProjectModel(project.id);
      const view = current.model.views[0];

      if (!view) {
        throw new Error('Project has no view');
      }

      const nodeKeySet = new Set(nodeKeys ?? []);
      const connectorIdSet = new Set(connectorIds ?? []);

      const nextModel: Model = {
        ...current.model,
        items: current.model.items.filter((item) => !nodeKeySet.has(item.id)),
        views: [
          {
            ...view,
            items: view.items.filter((item) => !nodeKeySet.has(item.id)),
            connectors: (view.connectors ?? []).filter((connector) => {
              if (connectorIdSet.has(connector.id)) return false;
              return !connector.anchors.some((anchor) => {
                return anchor.ref.item && nodeKeySet.has(anchor.ref.item);
              });
            })
          }
        ]
      };

      const saved = await putProjectModel(
        project.id,
        nextModel,
        current.revision
      );

      return textResult(
        `Deleted. Revision ${saved.revision}\n\n${describeModel(saved.model)}`
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

// tsx does not always set require.main === module for .ts entrypoints.
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
