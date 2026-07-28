import { getColorVariant } from './common';

export type ConnectorLabelEmphasis = 'SUBTLE' | 'CHIP' | 'CAPS';

type StyleBag = {
  container: Record<string, unknown>;
  text: Record<string, unknown>;
};

export const resolveConnectorLabelStyle = (
  emphasis: ConnectorLabelEmphasis | undefined,
  connectorColorValue: string
): StyleBag => {
  const level = emphasis ?? 'SUBTLE';
  const accent = getColorVariant(connectorColorValue, 'dark', { grade: 2 });
  const tintedShadow = `0 2px 6px ${getColorVariant(connectorColorValue, 'dark', {
    grade: 2,
    alpha: 0.35
  })}`;

  if (level === 'CHIP') {
    return {
      container: {
        py: 0.75,
        px: 1.5,
        bgcolor: accent,
        border: 'none',
        borderRadius: '999px',
        boxShadow: tintedShadow
      },
      text: {
        color: 'common.white',
        fontWeight: 700,
        fontSize: '0.875em'
      }
    };
  }

  if (level === 'CAPS') {
    return {
      container: {
        py: 0.75,
        px: 1.5,
        bgcolor: 'common.white',
        border: 'none',
        borderBottom: `3px solid ${accent}`,
        borderRadius: '4px',
        boxShadow: tintedShadow
      },
      text: {
        color: 'text.primary',
        fontWeight: 800,
        fontSize: '0.8em',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }
    };
  }

  return {
    container: {
      py: 0.75,
      px: 1,
      bgcolor: 'common.white',
      border: '1px solid',
      borderColor: 'grey.400',
      borderRadius: 2
    },
    text: {
      color: 'text.secondary',
      fontSize: '0.75em'
    }
  };
};
