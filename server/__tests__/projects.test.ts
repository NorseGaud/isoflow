import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import request from 'supertest';
import {
  configureDb,
  flushDb,
  initializeAppDb,
  resetDbClientForTests,
  resetInitializeAppDbForTests
} from '../../src/db';
import { createMemoryAdapter } from '../../src/db/adapters/memory';
import { createApp } from '../createApp';

const locateWasm = () => {
  // Avoid jest's `\\.wasm$` moduleNameMapper (it replaces require.resolve).
  return path.resolve(
    __dirname,
    '../../node_modules/sql.js/dist/sql-wasm.wasm'
  );
};

describe('isoflow server REST', () => {
  jest.setTimeout(30000);

  beforeEach(async () => {
    await resetDbClientForTests();
    resetInitializeAppDbForTests();
    configureDb({
      adapter: createMemoryAdapter(),
      locateWasm
    });
    await initializeAppDb();
  });

  afterEach(async () => {
    await resetDbClientForTests();
    resetInitializeAppDbForTests();
  });

  it('creates a project and updates model with revision checks', async () => {
    const app = createApp();

    const workspaces = await request(app).get('/api/workspaces').expect(200);
    const workspaceId = workspaces.body[0].id as string;

    const created = await request(app)
      .post('/api/projects')
      .send({ workspaceId, name: 'REST Demo' })
      .expect(201);

    const projectId = created.body.id as string;
    expect(created.body.revision).toBe(1);

    const modelResponse = await request(app)
      .get(`/api/projects/${projectId}/model`)
      .expect(200);

    expect(modelResponse.body.revision).toBe(1);
    expect(modelResponse.body.model.icons.length).toBeGreaterThan(100);

    const nextModel = {
      ...modelResponse.body.model,
      title: 'REST Demo Updated',
      icons: []
    };

    const put = await request(app)
      .put(`/api/projects/${projectId}/model`)
      .send({ model: nextModel, expectedRevision: 1 })
      .expect(200);

    expect(put.body.revision).toBe(2);
    expect(put.body.model.title).toBe('REST Demo Updated');

    await request(app)
      .put(`/api/projects/${projectId}/model`)
      .send({ model: nextModel, expectedRevision: 1 })
      .expect(409);

    const byName = await request(app)
      .get('/api/projects/by-name/REST%20Demo')
      .expect(200);

    expect(byName.body.id).toBe(projectId);
  });

  it('writes through the filesystem adapter', async () => {
    await resetDbClientForTests();
    resetInitializeAppDbForTests();
    const dbPath = path.join(
      os.tmpdir(),
      `isoflow-test-${Date.now()}.sqlite`
    );

    const { createFsAdapter } = await import('../adapters/fs');

    configureDb({
      adapter: createFsAdapter(dbPath),
      locateWasm
    });
    await initializeAppDb();
    await flushDb();

    const app = createApp();
    await request(app).get('/api/health').expect(200);
    expect(fs.existsSync(dbPath)).toBe(true);

    await resetDbClientForTests();
    fs.unlinkSync(dbPath);
  });
});
