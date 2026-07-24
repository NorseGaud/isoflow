import { getDb } from './client';
import { UserRecord } from './types';

type UserRow = {
  id: string;
  name: string;
  is_default: number;
  created_at: number;
};

const rowToUser = (row: UserRow): UserRecord => {
  return {
    id: row.id,
    name: row.name,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at
  };
};

export const DEFAULT_USER_ID = 'user-admin';

export const getDefaultUser = async (): Promise<UserRecord> => {
  const db = await getDb();
  const statement = db.prepare(
    `
      SELECT id, name, is_default, created_at
      FROM users
      WHERE is_default = 1
      LIMIT 1
    `
  );

  if (!statement.step()) {
    statement.free();
    throw new Error('Default user not found. Did seedDefaults run?');
  }

  const user = rowToUser(statement.getAsObject() as UserRow);
  statement.free();
  return user;
};

export const getUserById = async (id: string): Promise<UserRecord | null> => {
  const db = await getDb();
  const statement = db.prepare(
    `
      SELECT id, name, is_default, created_at
      FROM users
      WHERE id = ?
    `
  );
  statement.bind([id]);

  if (!statement.step()) {
    statement.free();
    return null;
  }

  const user = rowToUser(statement.getAsObject() as UserRow);
  statement.free();
  return user;
};
