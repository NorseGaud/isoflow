/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

const mockSetItemControls = jest.fn();
const mockUseViewItem = jest.fn();
const mockUseScene = jest.fn();
const mockUseModelStore = jest.fn();

jest.mock('src/hooks/useViewItem', () => {
  return {
    useViewItem: (id: string) => {
      return mockUseViewItem(id);
    }
  };
});

jest.mock('src/hooks/useScene', () => {
  return {
    useScene: () => {
      return mockUseScene();
    }
  };
});

jest.mock('src/stores/modelStore', () => {
  return {
    useModelStore: (selector: (state: unknown) => unknown) => {
      return mockUseModelStore(selector);
    }
  };
});

jest.mock('src/stores/uiStateStore', () => {
  return {
    useUiStateStore: (selector: (state: unknown) => unknown) => {
      return selector({
        actions: { setItemControls: mockSetItemControls }
      });
    }
  };
});

jest.mock('../TransformControls', () => {
  return {
    TransformControls: () => {
      return <div data-testid="transform-controls" />;
    }
  };
});

import { NodeTransformControls } from '../NodeTransformControls';

describe('NodeTransformControls stacked picker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseViewItem.mockReturnValue({
      id: 'n1',
      tile: { x: 0, y: 0 }
    });
    mockUseScene.mockReturnValue({
      items: [
        { id: 'n1', tile: { x: 0, y: 0 } },
        { id: 'n2', tile: { x: 0, y: 0 } }
      ]
    });
    mockUseModelStore.mockImplementation(
      (selector: (state: {
        items: unknown[];
        icons: unknown[];
      }) => unknown) => {
        return selector({
          items: [
            {
              id: 'n1',
              name: 'First',
              icon: 'icon-a'
            },
            {
              id: 'n2',
              name: 'Second',
              icon: 'icon-b'
            }
          ],
          icons: [
            { id: 'icon-a', url: 'https://example.com/a.png', name: 'A' },
            { id: 'icon-b', url: 'https://example.com/b.png', name: 'B' }
          ]
        });
      }
    );
  });

  test('shows stack badge when multiple nodes share the selected tile', () => {
    render(<NodeTransformControls id="n1" />);

    expect(screen.getByTestId('transform-controls')).toBeTruthy();
    expect(screen.getByRole('button', { name: /2 icons/i })).toBeTruthy();
  });

  test('hides stack badge when selected tile has a single node', () => {
    mockUseScene.mockReturnValue({
      items: [{ id: 'n1', tile: { x: 0, y: 0 } }]
    });

    render(<NodeTransformControls id="n1" />);

    expect(screen.queryByRole('button', { name: /icons/i })).toBeNull();
  });
});
