export type UserRecord = {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: number;
};

export type WorkspaceRecord = {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  createdAt: number;
};

export type ProjectRecord = {
  id: string;
  workspaceId: string;
  name: string;
  isDefault: boolean;
  modelJson: string;
  createdAt: number;
  updatedAt: number;
};
