import {
  getIsopackIcons,
  rehydrateIcons,
  stripIsopackIcons
} from '../icons';

describe('icon strip/rehydrate', () => {
  it('strips isopack icons and keeps custom ones', () => {
    const isopacks = getIsopackIcons();
    expect(isopacks.length).toBeGreaterThan(100);

    const model = {
      icons: [
        isopacks[0],
        {
          id: 'custom-1',
          name: 'Custom',
          url: 'data:image/svg+xml;base64,abc',
          collection: 'Custom'
        }
      ]
    };

    const stripped = stripIsopackIcons(model);
    expect(stripped.icons).toHaveLength(1);
    expect(stripped.icons[0].id).toBe('custom-1');
  });

  it('rehydrates isopack icons onto a stripped model', () => {
    const rehydrated = rehydrateIcons({
      icons: [
        {
          id: 'custom-1',
          name: 'Custom',
          url: 'data:image/svg+xml;base64,abc',
          collection: 'Custom'
        }
      ]
    });

    expect(rehydrated.icons.length).toBeGreaterThan(1000);
    expect(
      rehydrated.icons.some((icon) => icon.id === 'custom-1')
    ).toBe(true);
  });
});
