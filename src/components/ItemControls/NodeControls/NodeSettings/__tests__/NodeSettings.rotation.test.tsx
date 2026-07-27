/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
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

const mockUseIcon = jest.fn();
jest.mock('src/hooks/useIcon', () => {
  return {
    useIcon: (...args: unknown[]) => {
      return mockUseIcon(...args);
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

const node: ViewItem = {
  id: 'node1',
  tile: { x: 0, y: 0 },
  labelHeight: 80,
  rotation: 15
};

describe('NodeSettings rotation', () => {
  test('shows Rotation control for non-isometric icons', () => {
    mockUseIcon.mockReturnValue({
      icon: { id: 'icon1', name: 'Custom', url: '', isIsometric: false },
      iconComponent: null,
      hasLoaded: true
    });

    render(
      <NodeSettings
        node={node}
        onModelItemUpdated={jest.fn()}
        onViewItemUpdated={jest.fn()}
        onDeleted={jest.fn()}
      />
    );

    expect(screen.getByText('Rotation')).toBeTruthy();
  });

  test('hides Rotation control for isometric icons', () => {
    mockUseIcon.mockReturnValue({
      icon: { id: 'icon1', name: 'Pack', url: '', isIsometric: true },
      iconComponent: null,
      hasLoaded: true
    });

    render(
      <NodeSettings
        node={node}
        onModelItemUpdated={jest.fn()}
        onViewItemUpdated={jest.fn()}
        onDeleted={jest.fn()}
      />
    );

    expect(screen.queryByText('Rotation')).toBeNull();
  });
});
