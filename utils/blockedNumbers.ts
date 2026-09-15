export interface ParsedBlockedRange {
  start: number;
  end: number;
  label: string;
  count: number;
}

/**
 * Converte strings de entrada do admin como '0445-0455, 0120, 0300 a 0305'
 * em uma lista estruturada de intervalos numéricos.
 */
export function parseBlockedRanges(rawText?: string | null): ParsedBlockedRange[] {
  if (!rawText || typeof rawText !== "string") return [];

  // Divide por vírgula, ponto e vírgula ou quebra de linha
  const chunks = rawText.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
  const result: ParsedBlockedRange[] = [];

  for (const chunk of chunks) {
    // Tenta formato de faixa: '445-455', '0445 a 0455', '445 até 455'
    const rangeMatch = chunk.match(/^(\d+)\s*(?:-|–|—|\ba\b|\baté\b)\s*(\d+)$/i);
    if (rangeMatch) {
      const n1 = parseInt(rangeMatch[1], 10);
      const n2 = parseInt(rangeMatch[2], 10);
      if (!isNaN(n1) && !isNaN(n2) && n1 > 0 && n2 > 0) {
        const start = Math.min(n1, n2);
        const end = Math.max(n1, n2);
        const count = end - start + 1;
        const padLen = Math.max(4, String(end).length);
        const label = `${String(start).padStart(padLen, "0")} a ${String(end).padStart(padLen, "0")}`;
        result.push({ start, end, label, count });
      }
      continue;
    }

    // Número individual: '0120', '50'
    const singleMatch = chunk.match(/^(\d+)$/);
    if (singleMatch) {
      const n = parseInt(singleMatch[1], 10);
      if (!isNaN(n) && n > 0) {
        const padLen = Math.max(4, String(n).length);
        const label = String(n).padStart(padLen, "0");
        result.push({ start: n, end: n, label, count: 1 });
      }
    }
  }

  return result;
}

/**
 * Verifica se um determinado número está dentro de alguma faixa bloqueada.
 */
export function isNumberBlocked(
  numberCandidate: number | string,
  blockedRanges: ParsedBlockedRange[],
): boolean {
  const num = typeof numberCandidate === "string" ? parseInt(numberCandidate, 10) : numberCandidate;
  if (isNaN(num)) return false;

  for (const range of blockedRanges) {
    if (num >= range.start && num <= range.end) {
      return true;
    }
  }

  return false;
}

/**
 * Calcula a quantidade de números bloqueados únicos, respeitando o limite máximo do sorteio se houver.
 */
export function countUniqueBlockedNumbers(
  blockedRanges: ParsedBlockedRange[],
  maxLimit?: number | null,
): number {
  if (blockedRanges.length === 0) return 0;

  const blockedSet = new Set<number>();
  const limit = maxLimit && maxLimit > 0 ? maxLimit : 9999;

  for (const range of blockedRanges) {
    const from = Math.max(1, range.start);
    const to = Math.min(limit, range.end);
    for (let i = from; i <= to; i++) {
      blockedSet.add(i);
    }
  }

  return blockedSet.size;
}
