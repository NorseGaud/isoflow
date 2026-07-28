import { getColorVariant } from '../common';
import { resolveConnectorLabelStyle } from '../resolveConnectorLabelStyle';

const COLOR = '#a5b8f3';
const accent = getColorVariant(COLOR, 'dark', { grade: 2 });

describe('resolveConnectorLabelStyle', () => {
  test('treats undefined and SUBTLE as the quiet pill', () => {
    for (const emphasis of [undefined, 'SUBTLE'] as const) {
      const { container, text } = resolveConnectorLabelStyle(emphasis, COLOR);
      expect(container.bgcolor).toBe('common.white');
      expect(container.borderColor).toBe('grey.400');
      expect(text.color).toBe('text.secondary');
      expect(text.fontWeight).toBeUndefined();
      expect(text.textTransform).toBeUndefined();
    }
  });

  test('CHIP uses filled accent colour and bold white text', () => {
    const { container, text } = resolveConnectorLabelStyle('CHIP', COLOR);
    expect(container.bgcolor).toBe(accent);
    expect(container.border).toBe('none');
    expect(container.borderRadius).toBe('999px');
    expect(text.color).toBe('common.white');
    expect(text.fontWeight).toBe(700);
    expect(text.fontSize).toBe('0.875em');
    expect(String(container.boxShadow)).toMatch(/0\.35/);
  });

  test('CAPS uses white background, accent underline, and uppercase', () => {
    const { container, text } = resolveConnectorLabelStyle('CAPS', COLOR);
    expect(container.bgcolor).toBe('common.white');
    expect(container.border).toBe('none');
    expect(container.borderBottom).toBe(`3px solid ${accent}`);
    expect(container.borderRadius).toBe('4px');
    expect(text.color).toBe('text.primary');
    expect(text.fontWeight).toBe(800);
    expect(text.textTransform).toBe('uppercase');
    expect(text.letterSpacing).toBe('1px');
  });
});
