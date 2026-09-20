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

  let current = text;

  // Regla 1: Mapeos con flecha: P(x, y) → P'(x, -y) o A(3, 2) → A'(3, -2)
  current = applyMathRule(
    current,
    /\b([A-Za-z0-9'_]+\([^)]+\)\s*(?:→|\\to)\s*[A-Za-z0-9'_]+\([^)]+\))/g,
    (match) => {
      const latex = formulaToLatex(match).replace(/→/g, ' \\to ');
      return `$${latex.trim()}$`;
    }
  );

  // Regla 2: Vectores directores: v = (x, y)
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

  // Regla 3: Módulos con barras: |OA| = √(9+1) = √10 = |OA'| o |v| = ...
  current = applyMathRule(
    current,
    /(\|[A-Za-z0-9'_]+\|\s*=\s*[^✓\n;]+)/g,
    (match) => {
      let m = match.trim();
      const unitMatch = m.match(/\s+([a-zA-ZáéíóúÁÉÍÓÚ]+)$/);
      let unit = '';
      if (unitMatch) {
        unit = ' ' + unitMatch[1];
        m = m.slice(0, -unitMatch[0].length).trim();
      }
      return `$${formulaToLatex(m)}$${unit}`;
    }
  );

  // Regla 4: Puntos con coordenadas: A(1, 1), A'(3, -2), O(0, 0), C(1, 2), P'(x, y)
  current = applyMathRule(
    current,
    /\b([A-Z]'?)\s*\(([-0-9.,\s+\-*/k()a-z]+)\)/g,
    (_, label, coords) => `$${label}(${coords.trim()})$`
  );

  // Regla 5: Ecuaciones aritméticas explícitas tipo x' = 2(2) - (-1) = 5 (NO come texto en español)
  current = applyMathRule(
    current,
    /\b([xy]'?)\s*=\s*([-0-9+\-*/()·.\s]+=\s*-?\d+(?:\.\d+)?)/gi,
    (match) => `$${formulaToLatex(match.trim())}$`
  );

  // Regla 6: Asignaciones de variable aisladas tipo x = 2, k = 2.5 (NO seguidas de texto o dos puntos)
  current = applyMathRule(
    current,
    /\b([xyk]'?)\s*=\s*(-?\d+(?:\.\d+)?|[a-z])(?=[\s,;.)✓]|$)/gi,
    (_, varName, val) => `$${varName} = ${val}$`
  );

  // Regla 7: Ecuaciones con Área
  current = applyMathRule(
    current,
    /(?:Área|Area)\([^)]+\)\s*=\s*[^✓\n;]+/g,
    (match) => `$${formulaToLatex(match.trim())}$`
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
          const rawMath = isBlock ? part.slice(2, -2) : part.slice(1, -1);
          const math = formulaToLatex(rawMath);
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
