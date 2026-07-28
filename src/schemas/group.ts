import { z } from 'zod';
import { id, constrainedStrings } from './common';

export const groupSchema = z.object({
  id,
  name: constrainedStrings.name,
  color: id.optional(),
  memberIds: z.array(id)
});
