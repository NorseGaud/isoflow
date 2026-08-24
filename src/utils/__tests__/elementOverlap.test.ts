import {
  boxesOverlap,
  boxesTouch,
  findElementOverlaps,
  formatViewOverlaps,
  getBoxGap
} from '../elementOverlap';
import type { ViewElementBounds } from '../elementBounds';

describe('elementOverlap', () => {
  test('detects overlapping boxes', () => {
    expect(
      boxesOverlap(
        { left: 0, top: 0, width: 100, height: 40 },
        { left: 50, top: 10, width: 100, height: 40 }
      )
    ).toBe(true);
  });

  test('detects touching boxes with zero gap', () => {
    expect(
      boxesTouch(
        { left: 0, top: 0, width: 100, height: 40 },
        { left: 100, top: 0, width: 50, height: 40 },
        0
      )
    ).toBe(true);
  });

  test('reports negative gap when boxes overlap', () => {
    expect(
      getBoxGap(
        { left: 0, top: 0, width: 100, height: 40 },
        { left: 90, top: 0, width: 100, height: 40 }
      )
    ).toBeLessThan(0);
  });

  test('finds overlaps between diagram elements', () => {
    const elements: ViewElementBounds[] = [
      {
        id: 'packer:label',
        kind: 'node-label',
        box: { left: 0, top: 0, width: 100, height: 40 }
      },
      {
        id: 'conn-cli-vm-0:label',
        kind: 'connector-label',
        box: { left: 40, top: 10, width: 100, height: 36 }
      }
    ];

    const overlaps = findElementOverlaps(elements);

    expect(overlaps).toHaveLength(1);
    expect(overlaps[0].relation).toBe('overlapping');
    expect(formatViewOverlaps(overlaps)).toContain('packer:label');
  });
});
