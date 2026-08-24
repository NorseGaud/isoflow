import {
  getProjectModel,
  putProjectModel
} from '../api/client';
import type { InitialData, Model } from '../../../src/types';
import { ensureModelLayoutClearance } from '../../../src/utils/ensureModelLayoutClearance';

export const saveModelWithRetry = async (
  projectId: string,
  mutate: (model: InitialData) => Model | InitialData
): Promise<{ revision: number; model: InitialData }> => {
  const attempt = async () => {
    const current = await getProjectModel(projectId);
    const next = ensureModelLayoutClearance(mutate(current.model));
    return putProjectModel(projectId, next, current.revision);
  };

  try {
    return await attempt();
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status === 409) {
      return attempt();
    }
    throw error;
  }
};
