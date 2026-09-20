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
  s = s.replace(/cos\(/g, '\\cos(');
  s = s.replace(/Área\(/g, '\\text{Área}(');
  s = s.replace(/Area\(/g, '\\text{Área}(');
  s = s.replace(/√\(([^)]+)\)/g, '\\sqrt{$1}');
  s = s.replace(/√([0-9a-zA-Z]+)/g, '\\sqrt{$1}');
  s = s.replace(/(\d+)°/g, '$1^\\circ');
  return s;
}

/**
 * Aplica una regla regex SOLO a los fragmentos de texto plano,
 * protegiendo los fragmentos que ya están delimitados por $...$ o $$...$$.
 */
function applyMathRule(
  text: string,
  regex: RegExp,
  replacer: (...args: any[]) => string
): string {
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g);
  return parts
    .map((part) => {
      if (part.startsWith('$')) {
        return part; // Ya es un bloque KaTeX protegido, no tocar
      }
      return part.replace(regex, replacer);
    })
    .join('');
}

/**
 * Procesa un texto que puede mezclar prosa y expresiones matemáticas,
 * convirtiendo patrones matemáticos a delimitadores $...$ para KaTeX de forma segura.
 */
export function autoFormatMathText(text: string): string {
  if (!text) return '';

  let current = formulaToLatex(text);

  // Regla 1: Mapeos completos tipo P(x, y) \to P'(-y, x) o A(3, 2) \to A'(3, -2)
  current = applyMathRule(
    current,
    /([A-Za-z0-9'_]+\([^)]+\)\s*\\to\s*[A-Za-z0-9'_]+\([^)]+\))/g,
    (_, match) => `$${match.trim()}$`
  );

  // Regla 2: Vectores directores: v = (x, y) o (\Delta x, \Delta y)
  current = applyMathRule(
    current,
    /\bv\s*=\s*\(([^)]+)\)/g,
    (_, coords) => `$\\vec{v} = (${coords.trim()})$`
  );
  current = applyMathRule(
    current,
    /\((\s*Δx\s*,\s*Δy\s*)\)/g,
    () => `$(\\Delta x, \\Delta y)$`
  );
  current = applyMathRule(
    current,
    /\b\|v\|\b/g,
    () => `$|\\vec{v}|$`
  );

  // Regla 3: Módulos con barras: |OA| = \sqrt{9+1} = \sqrt{10} = |OA'| o |v| = ...
  current = applyMathRule(
    current,
    /(\|[A-Za-z0-9'_]+\|\s*=\s*[^✓\n;]+)/g,
    (match) => {
      let m = match.trim();
      const unitMatch = m.match(/\s+([a-zA-ZáéíóúÁÉÍÓÚ]+)$/);
      if (unitMatch) {
        const unit = unitMatch[1];
        m = m.slice(0, -unitMatch[0].length).trim();
        return `$${m}$ ${unit}`;
      }
      return `$${m}$`;
    }
  );

  // Regla 4: Puntos con coordenadas: A(1, 1), A'(3, -2), O(0, 0), C(1, 2), P'(x, y)
  current = applyMathRule(
    current,
    /\b([A-Z]'?)\s*\(([^)]+)\)/g,
    (_, label, coords) => `$${label}(${coords.trim()})$`
  );

  // Regla 5: Ecuaciones de coordenadas o sustituciones aritméticas:
  // x' = 2(2) - (-1) = 5 o y' = 4 o x' = x \cdot \cos(\alpha) ...
  current = applyMathRule(
    current,
    /\b([xy]'?)\s*=\s*([^,;\n]+)/gi,
    (match) => {
      if (/[0-9+\-*\\^()]/.test(match)) {
        return `$${match.trim()}$`;
      }
      return match;
    }
  );

  // Regla 6: Ecuaciones de factor de escala: k = 2.5
  current = applyMathRule(
    current,
    /\b([k])\s*=\s*(-?\d+(\.\d+)?)\b/gi,
    (_, varName, val) => `$${varName} = ${val}$`
  );

  // Regla 7: Ecuaciones con Área: \text{Área}(F') = k^2 \cdot \text{Área}(F)
  current = applyMathRule(
    current,
    /(\\text\{Área\}\([^)]+\)\s*=\s*[^✓\n;]+)/g,
    (match) => `$${match.trim()}$`
  );

  // Regla 8: Figuras o puntos primados sueltos: A'B'C', A', B', C', F', P'
  current = applyMathRule(
    current,
    /\b([A-Z]'[A-Z]'[A-Z]')\b/g,
    (_, match) => `$${match}$`
  );
  current = applyMathRule(
    current,
    /\b([A-Z]')\b/g,
    (_, match) => `$${match}$`
  );

  return current;
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
    <span className={`inline leading-relaxed whitespace-pre-line ${className}`}>
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
