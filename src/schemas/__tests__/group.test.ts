import { groupSchema } from '../group';

describe('groupSchema', () => {
  test('accepts a well-formed group', () => {
    const parsed = groupSchema.parse({
      id: 'g1',
      name: 'Controller path',
      color: 'color1',
      memberIds: ['a', 'b']
    });

    expect(parsed.memberIds).toEqual(['a', 'b']);
  });

  test('rejects a missing name', () => {
    expect(() => {
      groupSchema.parse({
        id: 'g1',
        memberIds: ['a']
      });
    }).toThrow();
  });

  test('rejects a non-array memberIds', () => {
    expect(() => {
      groupSchema.parse({
        id: 'g1',
        name: 'Group',
        memberIds: 'a'
      });
    }).toThrow();
  });
});
