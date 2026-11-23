/** A block of CMS text after HTML is flattened for native rendering. */
export type TextBlock = { kind: 'heading' | 'paragraph' | 'bullet'; text: string };

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…' };

const decode = (s: string) =>
  s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === '#') {
      const n = code[1]?.toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[code.toLowerCase()] ?? m;
  });

/**
 * The dashboard's rich-text editor saves HTML. Native has no HTML view, so headings, paragraphs and
 * list items become blocks and every other tag is dropped (links keep their text). Plain text with
 * blank lines works too.
 */
export const htmlToBlocks = (html: string | null | undefined): TextBlock[] => {
  if (!html?.trim()) return [];
  const marked = html
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, '')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*h[1-6][^>]*>/gi, '\n\n\u0001H')
    .replace(/<\s*li[^>]*>/gi, '\n\n\u0001L')
    .replace(/<\/\s*(p|div|h[1-6]|li|ul|ol|blockquote)\s*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '');
  return decode(marked)
    .split(/\n{2,}/)
    .map((chunk) =>
      chunk
        .replace(/[ \t]+/g, ' ')
        .replace(/ *\n */g, '\n')
        .trim(),
    )
    .filter((chunk) => chunk && chunk !== '\u0001H' && chunk !== '\u0001L')
    .map((chunk): TextBlock => {
      if (chunk.startsWith('\u0001H')) return { kind: 'heading', text: chunk.slice(2).trim() };
      if (chunk.startsWith('\u0001L')) return { kind: 'bullet', text: chunk.slice(2).trim() };
      return { kind: 'paragraph', text: chunk };
    })
    .filter((b) => b.text);
};
