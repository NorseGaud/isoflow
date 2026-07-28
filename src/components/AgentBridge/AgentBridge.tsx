import { useEffect, useRef } from 'react';
import { prepareModelForClient } from 'src/db/icons';
import { useInitialDataManager } from 'src/hooks/useInitialDataManager';
import { useUiStateStore } from 'src/stores/uiStateStore';
import type { InitialData, Model } from 'src/types';

export type AgentBridgeProps = {
  url: string;
  projectId: string;
  /** Skip applying events at or below this revision (avoids echo from local saves). */
  knownRevision?: number;
  onRemoteRevision?: (revision: number) => void;
};

type ModelChangedMessage = {
  type: 'model:changed';
  projectId: string;
  revision: number;
  model: InitialData;
};

export const AgentBridge = ({
  url,
  projectId,
  knownRevision = 0,
  onRemoteRevision
}: AgentBridgeProps) => {
  const { load } = useInitialDataManager();
  const scroll = useUiStateStore((state) => {
    return state.scroll;
  });
  const zoom = useUiStateStore((state) => {
    return state.zoom;
  });
  const setScroll = useUiStateStore((state) => {
    return state.actions.setScroll;
  });
  const setZoom = useUiStateStore((state) => {
    return state.actions.setZoom;
  });

  const viewStateRef = useRef({ scroll, zoom });
  const knownRevisionRef = useRef(knownRevision);

  useEffect(() => {
    viewStateRef.current = { scroll, zoom };
  }, [scroll, zoom]);

  useEffect(() => {
    knownRevisionRef.current = knownRevision;
  }, [knownRevision]);

  useEffect(() => {
    const wsUrl = `${url.replace(/\/$/, '')}/ws`;
    let socket: WebSocket | null = null;
    let closed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (closed) return;

      socket = new WebSocket(wsUrl);

      socket.addEventListener('open', () => {
        socket?.send(JSON.stringify({ type: 'subscribe', projectId }));
      });

      socket.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(String(event.data)) as ModelChangedMessage;

          if (message.type !== 'model:changed') return;
          if (message.projectId !== projectId) return;
          // Ignore echoes from our own saves / stale events.
          if (message.revision <= knownRevisionRef.current) return;

          const preserved = viewStateRef.current;
          const nextModel = prepareModelForClient(message.model as Model);

          load({
            ...nextModel,
            fitToView: false
          });

          window.requestAnimationFrame(() => {
            setScroll({
              position: preserved.scroll.position,
              offset: preserved.scroll.offset
            });
            setZoom(preserved.zoom);
          });

          knownRevisionRef.current = message.revision;
          onRemoteRevision?.(message.revision);
        } catch (error) {
          console.error('Failed to apply remote model change', error);
        }
      });

      socket.addEventListener('close', () => {
        if (closed) return;
        reconnectTimer = setTimeout(connect, 1000);
      });
    };

    connect();

    return () => {
      closed = true;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'unsubscribe', projectId }));
      }

      socket?.close();
    };
  }, [url, projectId, load, onRemoteRevision, setScroll, setZoom]);

  return null;
};
