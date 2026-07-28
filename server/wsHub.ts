import type { WebSocket } from 'ws';
import type { InitialData } from '../src/types';
import { stripIsopackIcons } from '../src/db/icons';

export type ModelChangedMessage = {
  type: 'model:changed';
  projectId: string;
  revision: number;
  model: InitialData;
};

type Client = {
  socket: WebSocket;
  projectIds: Set<string>;
};

const clients = new Set<Client>();

export const registerWsClient = (socket: WebSocket): void => {
  const client: Client = { socket, projectIds: new Set() };
  clients.add(client);

  socket.on('message', (raw) => {
    try {
      const message = JSON.parse(String(raw)) as {
        type?: string;
        projectId?: string;
      };

      if (message.type === 'subscribe' && message.projectId) {
        client.projectIds.add(message.projectId);
      }

      if (message.type === 'unsubscribe' && message.projectId) {
        client.projectIds.delete(message.projectId);
      }
    } catch {
      // ignore malformed client messages
    }
  });

  socket.on('close', () => {
    clients.delete(client);
  });
};

export const broadcastModelChanged = (
  projectId: string,
  revision: number,
  model: InitialData
): void => {
  const payload: ModelChangedMessage = {
    type: 'model:changed',
    projectId,
    revision,
    model: {
      ...stripIsopackIcons(model),
      fitToView: false
    }
  };

  const data = JSON.stringify(payload);

  clients.forEach((client) => {
    if (!client.projectIds.has(projectId)) return;
    if (client.socket.readyState !== 1) return;
    client.socket.send(data);
  });
};
