import React from 'react';
import katex from 'katex';

interface MathTextProps {
  text: string;
  className?: string;
  displayMode?: boolean;
}

/**
 * Normaliza símbolos matemáticos comunes a sintaxis LaTeX estándar
 */
export function formulaToLatex(raw: string): string {
  if (!raw) return '';
  let s = raw;
  s = s.replace(/→/g, ' \\to ');
  s = s.replace(/·/g, ' \\cdot ');
  s = s.replace(/α/g, ' \\alpha ');
  s = s.replace(/β/g, ' \\beta ');
  s = s.replace(/θ/g, ' \\theta ');
  s = s.replace(/²/g, '^2');
  s = s.replace(/³/g, '^3');
  s = s.replace(/×/g, ' \\times ');
  s = s.replace(/≠/g, ' \\neq ');
  s = s.replace(/≅/g, ' \\cong ');
  s = s.replace(/∘/g, ' \\circ ');
  s = s.replace(/sen\(/g, '\\sin(');
  s = s.replace(/√\(([^)]+)\)/g, '\\sqrt{$1}');
  s = s.replace(/√([0-9a-zA-Z]+)/g, '\\sqrt{$1}');
  s = s.replace(/(\d+)°/g, '$1^\\circ');
  return s;
}

/**
 * Procesa un texto que puede mezclar prosa y expresiones matemáticas,
 * convirtiendo patrones matemáticos a delimitadores $...$ para KaTeX.
 */
export function autoFormatMathText(text: string): string {
  if (!text) return '';

  // Si ya tiene delimitadores explícitos $, respetamos los bloques existentes y procesamos el resto
  const segments = text.split(/(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g);

  return segments
    .map((seg) => {
      if (seg.startsWith('$')) return seg;

      let formatted = formulaToLatex(seg);

      // 1. Módulos o igualdades matemáticas completas: |OA| = \sqrt{9+1} = \sqrt{10} = |OA'|
      // o |v| = \sqrt{3^2 + 4^2} = 5
      formatted = formatted.replace(
        /(\|?[A-Za-z0-9'_|]+\s*=\s*[^✓\n,;]+)/g,
        (match) => {
          if (/[=\\√^_+*\-]/.test(match)) {
            return `$${match.trim()}$`;
          }
          return match;
        }
      );

      // 2. Mapeos con flecha: A(3, 2) \to A'(3, -2) o P(x, y) \to P'(-y, x)
      formatted = formatted.replace(
        /([A-Za-z0-9'_]+\([^)]+\)\s*\\to\s*[A-Za-z0-9'_]+\([^)]+\))/g,
        '$$$1$'
      );

      // 3. Vector v = (x, y)
      formatted = formatted.replace(/\bv\s*=\s*\(([^)]+)\)/g, '$\\vec{v} = ($1)$');
      formatted = formatted.replace(/\b\|v\|\b/g, '$|\\vec{v}|$');

      // 4. Puntos con coordenadas: A(1, 1), A'(3, -2), O(0, 0), C(1, 2)
      formatted = formatted.replace(/\b([A-Z]'?)\s*\(([^)]+)\)/g, '$$1($2)$');

      // 5. Polígonos o figuras primadas: A'B'C', A', B', C', F', P'
      formatted = formatted.replace(/\b([A-Z]'[A-Z]'[A-Z]')\b/g, '$$1$');
      formatted = formatted.replace(/\b([A-Z]')\b/g, '$$1$');

      // 6. Ecuaciones simples: x = 2, y = -1, k = 2.5
      formatted = formatted.replace(/\b([xyk]'?)\s*=\s*(-?\d+(\.\d+)?|[a-z])\b/gi, '$$1 = $2$');

      // 7. Vector director (Δx, Δy)
      formatted = formatted.replace(/\((\s*Δx\s*,\s*Δy\s*)\)/g, '$(\\Delta x, \\Delta y)$');

      return formatted;
    })
    .join('');
}

export const MathText: React.FC<MathTextProps> = ({
  text,
  className = '',
  displayMode = false
}) => {
  if (!text) return null;

  // Si se solicita explícitamente displayMode para toda la fórmula
  if (displayMode) {
    const rawLatex = formulaToLatex(text.trim().replace(/^\$\$|\$\$$/g, '').replace(/^\$|\$$/g, ''));
    try {
      const html = katex.renderToString(rawLatex, {
        displayMode: true,
        throwOnError: false,
        output: 'html'
      });
      return (
        <div
          className={`katex-display-wrapper select-all ${className}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch {
      return <div className={`font-mono ${className}`}>{text}</div>;
    }
  }

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
