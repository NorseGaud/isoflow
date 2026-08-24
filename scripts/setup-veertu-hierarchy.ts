/**
 * Create / refresh Veertu Anka workspaces + projects from docs.veertu.com,
 * with readable overview diagrams (fresh layout each run).
 */
import {
  createProject,
  createWorkspace,
  getProjectByName,
  getProjectModel,
  listProjects,
  listWorkspaces,
  putProjectModel,
  type ProjectSummary,
  type WorkspaceSummary
} from '../mcp/src/api/client';
import { compileDiagramSpec } from '../mcp/src/compiler/compile';
import type { DiagramSpec } from '../mcp/src/compiler/types';

const API = process.env.ISOFLOW_API_URL ?? 'http://localhost:9324';

type ProjectSeed = {
  name: string;
  diagram: DiagramSpec;
};

type WorkspaceSeed = {
  name: string;
  projects: ProjectSeed[];
};

const hierarchy: WorkspaceSeed[] = [
  {
    name: 'Anka Virtualization',
    projects: [
      {
        name: 'How Virtualization Fits Together',
        diagram: {
          projectName: 'How Virtualization Fits Together',
          title: 'Anka Virtualization on a Mac',
          nodes: [
            {
              key: 'host',
              label: 'Your Mac (host)',
              icon: 'server',
              description: 'Runs the Anka Virtualization package'
            },
            {
              key: 'cli',
              label: 'anka command line',
              icon: 'terminal',
              description: 'Create, start, stop, and script VMs'
            },
            {
              key: 'app',
              label: 'Anka desktop app',
              icon: 'desktop',
              description: 'Optional GUI for day-to-day VM work'
            },
            {
              key: 'vm',
              label: 'macOS virtual machine',
              icon: 'vm',
              description: 'Apple hypervisor on Intel or Apple Silicon'
            },
            {
              key: 'packer',
              label: 'Packer (optional)',
              icon: 'cube',
              description: 'Automate building VM templates'
            },
            {
              key: 'device',
              label: 'USB device (e.g. iPhone)',
              icon: 'usb',
              description: 'Attach for on-device iOS testing'
            }
          ],
          edges: [
            { from: 'host', to: 'cli', label: 'installs' },
            { from: 'host', to: 'app', label: 'installs' },
            { from: 'cli', to: 'vm', label: 'creates & runs' },
            { from: 'app', to: 'vm', label: 'manages' },
            { from: 'packer', to: 'cli', style: 'DASHED', label: 'calls' },
            { from: 'vm', to: 'device', style: 'DOTTED', label: 'can attach' }
          ]
        }
      },
      {
        name: 'CLI Feature Map',
        diagram: {
          projectName: 'CLI Feature Map',
          title: 'What you can do with the Anka CLI',
          nodes: [
            {
              key: 'lifecycle',
              label: 'Start, stop, clone, export',
              icon: 'refresh',
              description: 'Everyday VM lifecycle commands'
            },
            {
              key: 'hardware',
              label: 'CPU, RAM, disk, network',
              icon: 'sliders',
              description: 'anka modify — reshape the VM'
            },
            {
              key: 'gpu',
              label: 'Metal graphics (GPU)',
              icon: 'gpu',
              description: 'Paravirtualized graphics inside the VM'
            },
            {
              key: 'nested',
              label: 'Nested virtualization',
              icon: 'layers',
              description: 'Where supported by macOS / hardware'
            },
            {
              key: 'security',
              label: 'Network security controls',
              icon: 'shield',
              description: 'e.g. IP filtering'
            },
            {
              key: 'usb',
              label: 'USB device passthrough',
              icon: 'usb',
              description: 'Attach phones and other USB devices'
            }
          ],
          edges: [
            { from: 'lifecycle', to: 'hardware', label: 'configure' },
            { from: 'hardware', to: 'gpu', style: 'DOTTED', label: 'optional' },
            {
              from: 'hardware',
              to: 'nested',
              style: 'DOTTED',
              label: 'optional'
            },
            {
              from: 'lifecycle',
              to: 'security',
              style: 'DASHED',
              label: 'harden'
            },
            { from: 'lifecycle', to: 'usb', style: 'DASHED', label: 'attach' }
          ]
        }
      }
    ]
  },
  {
    name: 'Anka Build Cloud',
    projects: [
      {
        name: 'Build Cloud at a Glance',
        diagram: {
          projectName: 'Build Cloud at a Glance',
          title: 'How CI jobs get a macOS VM',
          nodes: [
            {
              key: 'cicd',
              label: 'Your CI system',
              icon: 'pipeline',
              description: 'Jenkins, GitHub Actions, GitLab, Buildkite, …'
            },
            {
              key: 'controller',
              label: 'Build Cloud Controller',
              icon: 'load balancer',
              description: 'Queues jobs, schedules VMs, UI + API'
            },
            {
              key: 'registry',
              label: 'Template Registry',
              icon: 'database',
              description: 'Stores VM templates and tags'
            },
            {
              key: 'node_a',
              label: 'Build Node A (Mac)',
              icon: 'server',
              description: 'Anka Virtualization joined to the cluster',
              group: 'nodes'
            },
            {
              key: 'node_b',
              label: 'Build Node B (Mac)',
              icon: 'server',
              description: 'Another host in the pool',
              group: 'nodes'
            },
            {
              key: 'vm',
              label: 'On-demand macOS VM',
              icon: 'vm',
              description: 'Ephemeral (or persistent) VM for the job'
            }
          ],
          edges: [
            { from: 'cicd', to: 'controller', label: 'asks for a VM' },
            { from: 'controller', to: 'registry', label: 'picks template' },
            { from: 'controller', to: 'node_a', label: 'schedules' },
            { from: 'controller', to: 'node_b', label: 'schedules' },
            {
              from: 'registry',
              to: 'node_a',
              style: 'DASHED',
              label: 'node pulls image'
            },
            { from: 'node_a', to: 'vm', label: 'starts VM' }
          ],
          groups: [
            { key: 'nodes', color: '#a8dc9d' }
          ]
        }
      },
      {
        name: 'Ways to Run Controller & Registry',
        diagram: {
          projectName: 'Ways to Run Controller & Registry',
          title: 'Deployment options',
          nodes: [
            {
              key: 'binaries',
              label: 'Standalone binaries',
              icon: 'cube',
              description: 'Run Controller / Registry directly on Linux'
            },
            {
              key: 'compose',
              label: 'Docker Compose',
              icon: 'docker',
              description: 'Quick packaged install'
            },
            {
              key: 'helm',
              label: 'Kubernetes (Helm)',
              icon: 'kubernetes',
              description: 'Chart for HA-friendly clusters'
            },
            {
              key: 'controller',
              label: 'Controller service',
              icon: 'load balancer',
              description: 'Orchestration + web UI + API'
            },
            {
              key: 'registry',
              label: 'Registry service',
              icon: 'database',
              description: 'Template / tag storage'
            },
            {
              key: 'object',
              label: 'Object storage (optional)',
              icon: 'storage',
              description: 'S3 or Azure Blob backend'
            }
          ],
          edges: [
            { from: 'binaries', to: 'controller', style: 'DOTTED', label: 'one option' },
            { from: 'compose', to: 'controller', style: 'DOTTED', label: 'one option' },
            { from: 'helm', to: 'controller', style: 'DOTTED', label: 'one option' },
            { from: 'controller', to: 'registry', label: 'uses' },
            {
              from: 'registry',
              to: 'object',
              style: 'DASHED',
              label: 'can store layers'
            }
          ]
        }
      },
      {
        name: 'High Availability Shape',
        diagram: {
          projectName: 'High Availability Shape',
          title: 'HA-style Build Cloud layout',
          nodes: [
            {
              key: 'lb',
              label: 'Load balancer',
              icon: 'load balancer',
              description: 'Fronts Controller instances'
            },
            {
              key: 'c1',
              label: 'Controller instance 1',
              icon: 'server'
            },
            {
              key: 'c2',
              label: 'Controller instance 2',
              icon: 'server'
            },
            {
              key: 'etcd',
              label: 'Shared etcd',
              icon: 'database',
              description: 'Cluster state'
            },
            {
              key: 'registry',
              label: 'Registry',
              icon: 'storage',
              description: 'Templates available to all nodes'
            },
            {
              key: 'fleet',
              label: 'Fleet of Anka Nodes',
              icon: 'cluster',
              description: 'Mac hosts running Virtualization'
            }
          ],
          edges: [
            { from: 'lb', to: 'c1' },
            { from: 'lb', to: 'c2' },
            { from: 'c1', to: 'etcd' },
            { from: 'c2', to: 'etcd' },
            { from: 'c1', to: 'registry' },
            { from: 'c1', to: 'fleet', label: 'schedules VMs' }
          ]
        }
      },
      {
        name: 'Security Building Blocks',
        diagram: {
          projectName: 'Security Building Blocks',
          title: 'Controller & Registry security features',
          nodes: [
            {
              key: 'tls',
              label: 'TLS encryption',
              icon: 'lock',
              description: 'HTTPS between clients and services'
            },
            {
              key: 'ca',
              label: 'Root certificate authority',
              icon: 'certificate',
              description: 'Trust for cluster certificates'
            },
            {
              key: 'authz',
              label: 'Authorization',
              icon: 'shield',
              description: 'Who can do what'
            },
            {
              key: 'groups',
              label: 'Groups & permissions',
              icon: 'users',
              description: 'Team-scoped access'
            },
            {
              key: 'resources',
              label: 'Resource permissions',
              icon: 'key',
              description: 'Limit templates, nodes, etc.'
            },
            {
              key: 'uak',
              label: 'User API keys (UAK)',
              icon: 'token',
              description: 'Machine-friendly credentials'
            }
          ],
          edges: [
            { from: 'tls', to: 'ca', label: 'backed by' },
            { from: 'authz', to: 'groups', label: 'uses' },
            { from: 'groups', to: 'resources', label: 'scopes' },
            { from: 'authz', to: 'uak', style: 'DASHED', label: 'also issues' }
          ]
        }
      },
      {
        name: 'Health & Monitoring',
        diagram: {
          projectName: 'Health & Monitoring',
          title: 'How you observe the Build Cloud',
          nodes: [
            {
              key: 'controller',
              label: 'Controller',
              icon: 'server'
            },
            {
              key: 'registry',
              label: 'Registry',
              icon: 'database'
            },
            {
              key: 'probes',
              label: 'Health probes',
              icon: 'heart',
              description: '/livez and /readyz'
            },
            {
              key: 'logs',
              label: 'Service logs',
              icon: 'file',
              description: 'Controller and Registry log streams'
            },
            {
              key: 'metrics',
              label: 'Metrics / usage',
              icon: 'chart',
              description: 'Capacity and activity signals'
            }
          ],
          edges: [
            { from: 'controller', to: 'probes', label: 'exposes' },
            { from: 'registry', to: 'probes', label: 'exposes' },
            { from: 'controller', to: 'logs', label: 'writes' },
            {
              from: 'controller',
              to: 'metrics',
              style: 'DOTTED',
              label: 'reports'
            }
          ]
        }
      }
    ]
  },
  {
    name: 'Plugins & Integrations',
    projects: [
      {
        name: 'CI Tools that Talk to Anka',
        diagram: {
          projectName: 'CI Tools that Talk to Anka',
          title: 'Official plugins and integrations',
          nodes: [
            { key: 'jenkins', label: 'Jenkins', icon: 'jenkins' },
            { key: 'gha', label: 'GitHub Actions', icon: 'github' },
            { key: 'gitlab', label: 'GitLab CI', icon: 'gitlab' },
            { key: 'buildkite', label: 'Buildkite', icon: 'pipeline' },
            { key: 'teamcity', label: 'TeamCity', icon: 'pipeline' },
            {
              key: 'cloud',
              label: 'Anka Build Cloud',
              icon: 'cloud',
              description: 'Controller schedules VMs for plugins'
            },
            {
              key: 'cli',
              label: 'anka CLI on the node',
              icon: 'terminal',
              description: 'Used by controller-less runners'
            }
          ],
          edges: [
            { from: 'jenkins', to: 'cloud', label: 'plugin' },
            { from: 'gitlab', to: 'cloud', label: 'plugin' },
            { from: 'buildkite', to: 'cloud', label: 'plugin' },
            { from: 'teamcity', to: 'cloud', label: 'plugin' },
            {
              from: 'gha',
              to: 'cloud',
              style: 'DOTTED',
              label: 'can use cloud'
            },
            {
              from: 'gha',
              to: 'cli',
              style: 'DASHED',
              label: 'or run CLI actions'
            }
          ]
        }
      },
      {
        name: 'Packer Image Pipeline',
        diagram: {
          projectName: 'Packer Image Pipeline',
          title: 'Build a reusable Anka template with Packer',
          nodes: [
            {
              key: 'packer',
              label: 'Packer',
              icon: 'cube',
              description: 'Runs your image build definition'
            },
            {
              key: 'builder',
              label: 'Anka Packer builder',
              icon: 'wrench',
              description: 'Talks to Anka on the Mac'
            },
            {
              key: 'template',
              label: 'VM template',
              icon: 'vm',
              description: 'Golden image with Xcode / tools'
            },
            {
              key: 'tag',
              label: 'Registry tag',
              icon: 'tag',
              description: 'Versioned template in the Registry'
            }
          ],
          edges: [
            { from: 'packer', to: 'builder', label: 'invokes' },
            { from: 'builder', to: 'template', label: 'produces' },
            { from: 'template', to: 'tag', label: 'push' }
          ]
        }
      },
      {
        name: 'Controller vs Controller-less',
        diagram: {
          projectName: 'Controller vs Controller-less',
          title: 'Two ways CI can start Anka VMs',
          nodes: [
            {
              key: 'runner',
              label: 'CI runner / agent',
              icon: 'pipeline',
              description: 'Where your job script executes'
            },
            {
              key: 'cli',
              label: 'anka CLI (on Mac node)',
              icon: 'terminal',
              description: 'Controller-less path'
            },
            {
              key: 'registry_only',
              label: 'Registry only',
              icon: 'database',
              description: 'Pull templates without a Controller'
            },
            {
              key: 'plugin',
              label: 'CI plugin',
              icon: 'puzzle',
              description: 'Controller + Registry path'
            },
            {
              key: 'controller',
              label: 'Build Cloud Controller',
              icon: 'load balancer'
            },
            {
              key: 'vm',
              label: 'macOS VM for the job',
              icon: 'vm'
            }
          ],
          edges: [
            {
              from: 'runner',
              to: 'cli',
              label: 'controller-less'
            },
            {
              from: 'cli',
              to: 'registry_only',
              style: 'DASHED',
              label: 'pulls template'
            },
            { from: 'cli', to: 'vm', label: 'starts' },
            {
              from: 'runner',
              to: 'plugin',
              label: 'with Controller'
            },
            { from: 'plugin', to: 'controller', label: 'requests VM' },
            { from: 'controller', to: 'vm', label: 'starts' }
          ]
        }
      }
    ]
  },
  {
    name: 'AWS EC2 Mac',
    projects: [
      {
        name: 'Anka on EC2 Mac',
        diagram: {
          projectName: 'Anka on EC2 Mac',
          title: 'Running Anka on AWS EC2 Mac instances',
          nodes: [
            {
              key: 'aws',
              label: 'Amazon Web Services',
              icon: 'aws'
            },
            {
              key: 'ec2',
              label: 'EC2 Mac instance',
              icon: 'server',
              description: 'Dedicated Mac hardware in AWS'
            },
            {
              key: 'ami',
              label: 'Anka AMI',
              icon: 'disc',
              description: 'Marketplace or community image'
            },
            {
              key: 'anka',
              label: 'Anka Virtualization',
              icon: 'vm',
              description: 'Installed on the EC2 Mac'
            },
            {
              key: 'disk',
              label: 'Local instance storage',
              icon: 'storage',
              description: 'VM disks and caches'
            }
          ],
          edges: [
            { from: 'aws', to: 'ec2', label: 'provides' },
            { from: 'ami', to: 'ec2', label: 'boots' },
            { from: 'ec2', to: 'anka', label: 'runs' },
            {
              from: 'anka',
              to: 'disk',
              style: 'DOTTED',
              label: 'stores VMs'
            }
          ]
        }
      }
    ]
  },
  {
    name: 'Anka Develop & Flow',
    projects: [
      {
        name: 'Anka Develop',
        diagram: {
          projectName: 'Anka Develop',
          title: 'Anka Develop for individual MacBooks',
          nodes: [
            {
              key: 'laptop',
              label: 'Developer MacBook',
              icon: 'laptop',
              description: 'Laptop form factor'
            },
            {
              key: 'develop',
              label: 'Anka Develop license',
              icon: 'code',
              description: 'One VM at a time'
            },
            {
              key: 'vm',
              label: 'Personal macOS VM',
              icon: 'vm',
              description: 'Isolated environment for coding / testing'
            }
          ],
          edges: [
            { from: 'laptop', to: 'develop', label: 'installs' },
            { from: 'develop', to: 'vm', label: 'runs' }
          ]
        }
      },
      {
        name: 'Anka Flow',
        diagram: {
          projectName: 'Anka Flow',
          title: 'Anka Flow setup path',
          nodes: [
            {
              key: 'flow',
              label: 'Anka Flow',
              icon: 'workflow',
              description: 'Flow product for managed VM workflows'
            },
            {
              key: 'setup',
              label: 'Install & configure',
              icon: 'settings',
              description: 'Follow the Flow getting-started docs'
            },
            {
              key: 'vms',
              label: 'Managed macOS VMs',
              icon: 'vm'
            }
          ],
          edges: [
            { from: 'flow', to: 'setup', label: 'start here' },
            { from: 'setup', to: 'vms', label: 'produces' }
          ]
        }
      }
    ]
  },
  {
    name: 'Artificial Intelligence',
    projects: [
      {
        name: 'Isolating AI Coding Agents',
        diagram: {
          projectName: 'Isolating AI Coding Agents',
          title: 'Keep AI agents inside an Anka VM',
          nodes: [
            {
              key: 'host',
              label: 'Host Mac',
              icon: 'server',
              description: 'Your machine or CI node'
            },
            {
              key: 'vm',
              label: 'Isolated Anka VM',
              icon: 'vm',
              description: 'Sandbox for untrusted agent activity'
            },
            {
              key: 'agent',
              label: 'AI coding agent',
              icon: 'robot',
              description: 'Runs tools and edits code inside the VM'
            },
            {
              key: 'project',
              label: 'Project & toolchain',
              icon: 'code',
              description: 'Repo, SDKs, and build tools in the guest'
            }
          ],
          edges: [
            { from: 'host', to: 'vm', label: 'starts' },
            { from: 'agent', to: 'vm', label: 'confined to' },
            { from: 'vm', to: 'project', label: 'contains' }
          ]
        }
      }
    ]
  }
];

const ensureWorkspace = async (name: string): Promise<WorkspaceSummary> => {
  const existing = (await listWorkspaces()).find((workspace) => {
    return workspace.name === name;
  });
  if (existing) {
    console.log(`  workspace exists: ${name}`);
    return existing;
  }
  const created = await createWorkspace(name);
  console.log(`  workspace created: ${name}`);
  return created;
};

const ensureProject = async (
  workspaceId: string,
  name: string
): Promise<ProjectSummary> => {
  const existing = await getProjectByName(name, workspaceId);
  if (existing) {
    console.log(`    project exists: ${name}`);
    return existing;
  }
  const created = await createProject(workspaceId, name);
  console.log(`    project created: ${name}`);
  return created;
};

/** Always recompile from scratch so old cramped tiles / group text are discarded. */
const seedDiagram = async (project: ProjectSummary, spec: DiagramSpec) => {
  const current = await getProjectModel(project.id);
  const compiled = compileDiagramSpec({
    ...spec,
    projectName: project.name
  });
  const saved = await putProjectModel(project.id, compiled, current.revision);
  console.log(`    diagram refreshed (rev ${saved.revision})`);
};

const deleteStaleProjects = async (
  workspaceId: string,
  keepNames: Set<string>
) => {
  const projects = await listProjects(workspaceId);
  for (const project of projects) {
    if (keepNames.has(project.name)) continue;
    const response = await fetch(
      `${API}/api/projects/${encodeURIComponent(project.id)}`,
      { method: 'DELETE' }
    );
    if (response.ok || response.status === 204) {
      console.log(`    removed stale project: ${project.name}`);
    }
  }
};

const main = async () => {
  console.log(`API: ${API}`);
  console.log('Refreshing Veertu docs hierarchy with readable diagrams…\n');

  const managedWorkspaceNames = new Set(
    hierarchy.map((workspace) => workspace.name)
  );

  for (const workspaceSeed of hierarchy) {
    console.log(`Workspace: ${workspaceSeed.name}`);
    const workspace = await ensureWorkspace(workspaceSeed.name);
    const keep = new Set(
      workspaceSeed.projects.map((project) => project.name)
    );
    await deleteStaleProjects(workspace.id, keep);

    for (const projectSeed of workspaceSeed.projects) {
      const project = await ensureProject(workspace.id, projectSeed.name);
      await seedDiagram(project, projectSeed.diagram);
    }
    console.log('');
  }

  // Leave unrelated workspaces (Default, build cloud, etc.) alone.
  console.log('Managed inventory:');
  for (const workspace of await listWorkspaces()) {
    if (!managedWorkspaceNames.has(workspace.name)) continue;
    console.log(`- ${workspace.name}`);
    for (const project of await listProjects(workspace.id)) {
      console.log(`    • ${project.name}`);
    }
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
