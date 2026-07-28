/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StackedItemsPicker } from '../StackedItemsPicker';

const options = [
  {
    id: 'n1',
    name: 'First',
    description: 'Alpha desc',
    iconUrl: 'https://example.com/a.png'
  },
  {
    id: 'n2',
    name: 'Second',
    description: null,
    iconUrl: 'https://example.com/b.png'
  }
];

describe('StackedItemsPicker', () => {
  test('shows count badge and selects item from popover', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    render(
      <StackedItemsPicker
        tile={{ x: 0, y: 0 }}
        selectedId="n1"
        options={options}
        onSelect={onSelect}
      />
    );

    expect(screen.getByRole('button', { name: /2 icons/i })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /2 icons/i }));

    expect(screen.getByText('First')).toBeTruthy();
    expect(screen.getByText('Alpha desc')).toBeTruthy();
    expect(screen.getByText('Second')).toBeTruthy();

    await user.click(screen.getByText('Second'));

    expect(onSelect).toHaveBeenCalledWith('n2');
  });

  test('renders nothing when fewer than 2 options', () => {
    const { container } = render(
      <StackedItemsPicker
        tile={{ x: 0, y: 0 }}
        selectedId="n1"
        options={[options[0]]}
        onSelect={jest.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
