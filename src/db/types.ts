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
  createdAt: number;
};

export type ProjectRecord = {
  id: string;
  workspaceId: string;
  name: string;
  modelJson: string;
  revision: number;
  createdAt: number;
  updatedAt: number;
};

export class RevisionConflictError extends Error {
  readonly currentRevision: number;

  constructor(currentRevision: number) {
    super(
      `Revision conflict: expected a different revision (current=${currentRevision})`
    );
    this.name = 'RevisionConflictError';
    this.currentRevision = currentRevision;
  }
}
