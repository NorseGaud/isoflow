import type { EditorModeEnum, MainMenuOptions } from './common';
import type { Model } from './model';
import type { RendererProps } from './rendererProps';

export type InitialData = Model & {
  fitToView?: boolean;
  view?: string;
};

export type IsoflowBridgeProps = {
  url: string;
  projectId: string;
  knownRevision?: number;
  onRemoteRevision?: (revision: number) => void;
};

export interface IsoflowProps {
  initialData?: InitialData;
  mainMenuOptions?: MainMenuOptions;
  onModelUpdated?: (Model: Model) => void;
  width?: number | string;
  height?: number | string;
  enableDebugTools?: boolean;
  editorMode?: keyof typeof EditorModeEnum;
  renderer?: RendererProps;
  /** Keep the live model title aligned with the project name. */
  editorTitle?: string;
  /** Live sync with isoflow-server WebSocket (agent / multi-tab updates). */
  bridge?: IsoflowBridgeProps;
}
