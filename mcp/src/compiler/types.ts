export type DiagramNodeSpec = {
  key: string;
  label: string;
  icon?: string;
  description?: string;
  group?: string;
};

export type DiagramEdgeSpec = {
  from: string;
  to: string;
  style?: 'SOLID' | 'DOTTED' | 'DASHED';
  label?: string;
};

export type DiagramGroupSpec = {
  key: string;
  label?: string;
  color?: string;
};

export type DiagramSpec = {
  projectName: string;
  title?: string;
  nodes: DiagramNodeSpec[];
  edges?: DiagramEdgeSpec[];
  groups?: DiagramGroupSpec[];
};
