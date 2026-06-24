export interface Chunk {
  text: string;
  filePath: string;
  headingTrail: string[];
  charStart: number;
}

export function chunkMarkdown(content: string, filePath: string, maxChars: number): Chunk[] {
  const lines = content.split('\n');
  const chunks: Chunk[] = [];

  // Stack entries: [headingLevel, headingTitle]
  const headingStack: Array<[number, string]> = [];
  let buffer = '';
  let bufferStart = 0;
  let charOffset = 0;

  function flush() {
    const trimmed = buffer.trim();
    if (trimmed.length >= 80) {
      const trail = headingStack.map(([, title]) => title);
      for (const part of splitAtParagraphs(buffer, maxChars)) {
        chunks.push({ text: part.trim(), filePath, headingTrail: trail, charStart: bufferStart });
      }
    }
    buffer = '';
  }

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);

    if (headingMatch) {
      flush();
      bufferStart = charOffset;

      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();

      // Pop all headings at same or deeper level
      while (headingStack.length > 0 && headingStack[headingStack.length - 1][0] >= level) {
        headingStack.pop();
      }
      headingStack.push([level, title]);

      buffer = line + '\n';
    } else {
      buffer += line + '\n';
    }

    charOffset += line.length + 1;
  }

  flush();
  return chunks;
}

function splitAtParagraphs(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const parts: string[] = [];
  let remaining = text;

  while (remaining.length > maxChars) {
    const slice = remaining.slice(0, maxChars);

    // Prefer splitting at a blank line (paragraph break)
    let splitAt = slice.lastIndexOf('\n\n');
    if (splitAt > 0) {
      parts.push(remaining.slice(0, splitAt));
      remaining = remaining.slice(splitAt + 2);
      continue;
    }

    // Fall back to last newline
    splitAt = slice.lastIndexOf('\n');
    if (splitAt > 0) {
      parts.push(remaining.slice(0, splitAt));
      remaining = remaining.slice(splitAt + 1);
      continue;
    }

    // Hard split if no whitespace found
    parts.push(remaining.slice(0, maxChars));
    remaining = remaining.slice(maxChars);
  }

  if (remaining.trim().length > 0) parts.push(remaining);
  return parts;
}
