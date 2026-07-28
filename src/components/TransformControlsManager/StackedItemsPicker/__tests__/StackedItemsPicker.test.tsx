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
  test('shows picker rows by default and selects an item', async () => {
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

    expect(screen.getByText('First')).toBeTruthy();
    expect(screen.getByText('Alpha desc')).toBeTruthy();
    expect(screen.getByText('Second')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /2 icons/i })).toBeNull();

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

  test('lays out nameless icons beside named options', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    render(
      <StackedItemsPicker
        tile={{ x: 0, y: 0 }}
        selectedId="n1"
        options={[
          {
            id: 'n1',
            name: '',
            description: null,
            iconUrl: 'https://example.com/a.png'
          },
          {
            id: 'n2',
            name: 'Anka VMs',
            description: null,
            iconUrl: 'https://example.com/b.png'
          }
        ]}
        onSelect={onSelect}
      />
    );

    const listbox = screen.getByRole('listbox', { name: /stacked icons/i });
    expect(listbox.getAttribute('data-layout')).toBe('row');
    expect(screen.getByText('Anka VMs')).toBeTruthy();

    await user.click(screen.getByRole('option', { name: /untitled icon/i }));

    expect(onSelect).toHaveBeenCalledWith('n1');
  });
});
