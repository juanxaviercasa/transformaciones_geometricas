import React from 'react';
import katex from 'katex';

interface MathTextProps {
  text: string;
  className?: string;
}

/**
 * Convierte expresiones matemáticas comunes a sintaxis LaTeX estándar si no tienen delimitadores $...$
 */
function autoFormatMathText(text: string): string {
  if (!text) return '';
  // Si ya tiene delimitadores $, respetamos la autoría
  if (text.includes('$')) return text;

  let formatted = text;

  // Vector v = (x, y)
  formatted = formatted.replace(/\bv\s*=\s*\(([^)]+)\)/g, '$\\vec{v} = ($1)$');

  // Rectas x = k, y = k, y = x, y = -x
  formatted = formatted.replace(/\b([xy])\s*=\s*(-?\d+(\.\d+)?|[a-z])/gi, '$$1 = $2$');

  // Puntos tipo A(1, 1), B(-3, 2), O(0, 0), C(1, 2)
  formatted = formatted.replace(/\b([A-Z])\s*\(([^)]+)\)/g, '$$1($2)$');

  // Vértices primados tipo A'B'C' o A', B', C'
  formatted = formatted.replace(/\b([A-Z]'[A-Z]'[A-Z]')\b/g, '$$1$');
  formatted = formatted.replace(/\b([A-Z]')\b/g, '$$1$');

  // Figuras F y F'
  formatted = formatted.replace(/\bF'\b/g, "$F'$");

  // Ángulos tipo 90°, 180°, 270°, 360°, 45°
  formatted = formatted.replace(/(\d+)°/g, '$$1^\\circ$');

  // Razón k = 2, k = -1.5
  formatted = formatted.replace(/\bk\s*=\s*(-?\d+(\.\d+)?)\b/g, '$k = $1$');

  // Vector director v = (Δx, Δy)
  formatted = formatted.replace(/\((\s*Δx\s*,\s*Δy\s*)\)/g, '$(\\Delta x, \\Delta y)$');

  return formatted;
}

export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  const processedText = autoFormatMathText(text);

  // Divide el texto entre bloques matemáticos $...$ y texto plano
  const parts = processedText.split(/(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g);

  return (
    <span className={`inline leading-relaxed ${className}`}>
      {parts.map((part, index) => {
        if (!part) return null;

        const isBlock = part.startsWith('$$') && part.endsWith('$$');
        const isInline = !isBlock && part.startsWith('$') && part.endsWith('$');

        if (isBlock || isInline) {
          const math = isBlock ? part.slice(2, -2) : part.slice(1, -1);
          try {
            const html = katex.renderToString(math, {
              displayMode: isBlock,
              throwOnError: false,
              output: 'html'
            });
            return (
              <span
                key={index}
                className={isBlock ? 'block my-2 text-center' : 'inline-block px-0.5 align-baseline'}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return <span key={index}>{part}</span>;
          }
        }

        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
};
