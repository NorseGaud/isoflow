import { connectorSchema } from '../connector';

describe('connectorSchema labelEmphasis', () => {
  const base = {
    id: 'c1',
    anchors: [
      { id: 'a1', ref: { item: 'n1' } },
      { id: 'a2', ref: { item: 'n2' } }
    ]
  };

  test('accepts omitted, SUBTLE, CHIP, CAPS', () => {
    expect(connectorSchema.parse(base).labelEmphasis).toBeUndefined();
    expect(
      connectorSchema.parse({ ...base, labelEmphasis: 'SUBTLE' }).labelEmphasis
    ).toBe('SUBTLE');
    expect(
      connectorSchema.parse({ ...base, labelEmphasis: 'CHIP' }).labelEmphasis
    ).toBe('CHIP');
    expect(
      connectorSchema.parse({ ...base, labelEmphasis: 'CAPS' }).labelEmphasis
    ).toBe('CAPS');
  });

  test('rejects unknown values', () => {
    expect(() =>
      connectorSchema.parse({ ...base, labelEmphasis: 'LOUD' })
    ).toThrow();
  });
});
