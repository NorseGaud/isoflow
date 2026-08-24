import React, { useRef, useMemo } from 'react';
import { Box, SxProps } from '@mui/material';
import { getLabelAttachTransform, getLabelLineEnd } from 'src/utils/labelGeometry';

const CONNECTOR_DOT_SIZE = 3;

export interface Props {
  labelHeight?: number;
  labelAngle?: number;
  maxWidth: number;
  maxHeight?: number;
  expandDirection?: 'CENTER' | 'BOTTOM';
  children: React.ReactNode;
  sx?: SxProps;
}

export const Label = ({
  children,
  maxWidth,
  maxHeight,
  expandDirection = 'CENTER',
  labelHeight = 0,
  labelAngle = 0,
  sx
}: Props) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const lineEnd = useMemo(() => {
    return getLabelLineEnd(labelHeight, labelAngle);
  }, [labelHeight, labelAngle]);

  const lineBounds = useMemo(() => {
    if (labelHeight <= 0) {
      return null;
    }

    const padding = CONNECTOR_DOT_SIZE;
    const minX = Math.min(0, lineEnd.x) - padding;
    const minY = Math.min(0, lineEnd.y) - padding;
    const maxX = Math.max(0, lineEnd.x) + padding;
    const maxY = Math.max(0, lineEnd.y) + padding;

    return {
      minX,
      minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }, [labelHeight, lineEnd.x, lineEnd.y]);

  const labelTransform = useMemo(() => {
    if (labelHeight > 0) {
      return getLabelAttachTransform(labelAngle);
    }

    return expandDirection === 'BOTTOM'
      ? 'translate(-50%, -100%)'
      : 'translate(-50%, -50%)';
  }, [expandDirection, labelAngle, labelHeight]);

  const labelPosition = useMemo(() => {
    if (labelHeight > 0) {
      return { left: lineEnd.x, top: lineEnd.y };
    }

    return { left: 0, top: -labelHeight };
  }, [labelHeight, lineEnd.x, lineEnd.y]);

  return (
    <Box
      sx={{
        position: 'absolute',
        width: maxWidth
      }}
    >
      {lineBounds && (
        <Box
          component="svg"
          viewBox={`${lineBounds.minX} ${lineBounds.minY} ${lineBounds.width} ${lineBounds.height}`}
          sx={{
            position: 'absolute',
            overflow: 'visible',
            pointerEvents: 'none'
          }}
          style={{
            left: lineBounds.minX,
            top: lineBounds.minY,
            width: lineBounds.width,
            height: lineBounds.height
          }}
        >
          <line
            x1={0}
            y1={0}
            x2={lineEnd.x}
            y2={lineEnd.y}
            strokeDasharray={`0, ${CONNECTOR_DOT_SIZE * 2}`}
            stroke="black"
            strokeWidth={CONNECTOR_DOT_SIZE}
            strokeLinecap="round"
          />
        </Box>
      )}
      <Box
        ref={contentRef}
        sx={{
          position: 'absolute',
          display: 'inline-block',
          bgcolor: 'common.white',
          border: '1px solid',
          borderColor: 'grey.400',
          borderRadius: 2,
          py: 1,
          px: 1.5,
          overflow: 'hidden',
          ...sx
        }}
        style={{
          maxHeight,
          left: labelPosition.left,
          top: labelPosition.top,
          transform: labelTransform
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
