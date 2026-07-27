/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import { Icon } from 'src/types';
import { NonIsometricIcon } from '../NonIsometricIcon';

const icon: Icon = {
  id: 'custom1',
  name: 'Custom',
  url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
  isIsometric: false
};

describe('NonIsometricIcon rotation', () => {
  test('applies rotate transform on the image when rotation is set', () => {
    const { container } = render(
      <NonIsometricIcon icon={icon} rotation={90} />
    );
    const img = container.querySelector('img');

    expect(img).not.toBeNull();
    expect(getComputedStyle(img!).transform).toContain('rotate(90deg)');
  });

  test('defaults to rotate(0deg) when rotation omitted', () => {
    const { container } = render(<NonIsometricIcon icon={icon} />);
    const img = container.querySelector('img');

    expect(img).not.toBeNull();
    expect(getComputedStyle(img!).transform).toContain('rotate(0deg)');
  });
});
