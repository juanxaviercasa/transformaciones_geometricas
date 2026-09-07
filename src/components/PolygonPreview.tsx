import React from 'react';
import { Point } from '../types/geometry';

interface PolygonPreviewProps {
  vertices: Point[];
  className?: string;
  strokeColor?: string;
  fillColor?: string;
}

export const PolygonPreview: React.FC<PolygonPreviewProps> = ({
  vertices,
  className = '',
  strokeColor = 'currentColor',
  fillColor = 'currentColor',
}) => {
  if (vertices.length === 0) return null;

  // Calculate bounding box
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  vertices.forEach((v) => {
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
  });

  const width = maxX - minX;
  const height = maxY - minY;

  // Add padding (50% of width/height to avoid edges entirely)
  const padX = (width * 0.5) || 2; 
  const padY = (height * 0.5) || 2;

  // Use mathematical viewBox directly with Y inverted
  const vbMinX = minX - padX;
  const vbMinY = -maxY - padY;
  const vbWidth = width + padX * 2;
  const vbHeight = height + padY * 2;

  const pointsString = vertices.map((v) => `${v.x},${v.y}`).join(' ');

  return (
    <svg
      viewBox={`${vbMinX} ${vbMinY} ${vbWidth} ${vbHeight}`}
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <g transform="scale(1, -1)">
        <polygon
          points={pointsString}
          fill={fillColor}
          fillOpacity={0.2}
          stroke={strokeColor}
          strokeWidth={Math.max(vbWidth, vbHeight) * 0.02}
          strokeLinejoin="round"
        />
        {vertices.map((v, i) => (
          <circle
            key={i}
            cx={v.x}
            cy={v.y}
            r={Math.max(vbWidth, vbHeight) * 0.035}
            fill={strokeColor}
          />
        ))}
      </g>
    </svg>
  );
};
