import { resolveIconId, searchIcons } from '../match';

describe('icon matcher', () => {
  it('resolves common AWS queries to aws icons', () => {
    expect(resolveIconId('lambda')).toMatch(/lambda/i);
    expect(resolveIconId('s3')).toMatch(/s3/i);
    expect(resolveIconId('ec2')).toMatch(/ec2/i);
  });

  it('resolves isometric networking terms', () => {
    expect(resolveIconId('load balancer')).toBeTruthy();
    expect(resolveIconId('server')).toBeTruthy();
  });

  it('ranks exact matches above substrings', () => {
    const matches = searchIcons('lambda', 5);
    expect(matches[0].score).toBeGreaterThanOrEqual(matches[1]?.score ?? 0);
    expect(matches[0].id.toLowerCase()).toContain('lambda');
  });

  it('can filter by collection', () => {
    const matches = searchIcons('pod', 5, 'kubernetes');
    expect(matches.length).toBeGreaterThan(0);
    matches.forEach((match) => {
      expect(match.collection).toBe('kubernetes');
    });
  });
});
