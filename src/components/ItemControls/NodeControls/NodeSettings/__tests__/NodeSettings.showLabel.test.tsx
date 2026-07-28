/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewItem } from 'src/types';
import { NodeSettings } from '../NodeSettings';

jest.mock('src/hooks/useModelItem', () => {
  return {
    useModelItem: () => {
      return {
        id: 'node1',
        name: 'Node',
        icon: 'icon1'
      };
    }
  };
});

jest.mock('src/hooks/useIcon', () => {
  return {
    useIcon: () => {
      return {
        icon: { id: 'icon1', name: 'Pack', url: '', isIsometric: true },
        iconComponent: null,
        hasLoaded: true
      };
    }
  };
});

jest.mock('src/components/MarkdownEditor/MarkdownEditor', () => {
  return {
    MarkdownEditor: () => {
      return null;
    }
  };
});

const baseNode: ViewItem = {
  id: 'node1',
  tile: { x: 0, y: 0 },
  labelHeight: 80
};

describe('NodeSettings showLabel', () => {
  test('shows Label height when showLabel is omitted (legacy visible)', () => {
    render(
      <NodeSettings
        node={baseNode}
        onModelItemUpdated={jest.fn()}
        onViewItemUpdated={jest.fn()}
        onDeleted={jest.fn()}
      />
    );

    expect(screen.getByText('Show label on canvas')).toBeTruthy();
    expect(screen.getByText('Label height')).toBeTruthy();
  });

  test('hides Label height when showLabel is false', () => {
    render(
      <NodeSettings
        node={{ ...baseNode, showLabel: false }}
        onModelItemUpdated={jest.fn()}
        onViewItemUpdated={jest.fn()}
        onDeleted={jest.fn()}
      />
    );

    expect(screen.queryByText('Label height')).toBeNull();
  });

  test('toggling switch updates showLabel', async () => {
    const onViewItemUpdated = jest.fn();
    const user = userEvent.setup();

    render(
      <NodeSettings
        node={{ ...baseNode, showLabel: false }}
        onModelItemUpdated={jest.fn()}
        onViewItemUpdated={onViewItemUpdated}
        onDeleted={jest.fn()}
      />
    );

    await user.click(
      screen.getByRole('switch', { name: 'Show label on canvas' })
    );

    expect(onViewItemUpdated).toHaveBeenCalledWith({ showLabel: true });
  });
});
