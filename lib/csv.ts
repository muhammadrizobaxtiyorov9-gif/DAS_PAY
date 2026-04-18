import 'server-only';

export function toCsvRow(values: Array<string | number | null | undefined | Date>): string {
  return values
    .map((v) => {
      if (v === null || v === undefined) return '';
      const s = v instanceof Date ? v.toISOString() : String(v);
      const needsQuote = /[",\n\r;]/.test(s);
      const escaped = s.replace(/"/g, '""');
      return needsQuote ? `"${escaped}"` : escaped;
    })
    .join(',');
}

export function toCsv(headers: string[], rows: Array<Array<string | number | null | undefined | Date>>): string {
  const lines = [toCsvRow(headers), ...rows.map(toCsvRow)];
  // UTF-8 BOM so Excel opens Cyrillic correctly
  return '\uFEFF' + lines.join('\n');
}
