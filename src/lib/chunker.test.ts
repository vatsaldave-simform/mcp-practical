import { describe, it, expect } from 'vitest';
import { chunkMarkdown } from './chunker.js';

const MAX = 1500;

describe('chunkMarkdown', () => {
  it('returns empty array for blank content', () => {
    expect(chunkMarkdown('', 'test.md', MAX)).toEqual([]);
  });

  it('skips sections shorter than 80 chars', () => {
    const md = '# Title\n\nShort.\n';
    const chunks = chunkMarkdown(md, 'test.md', MAX);
    expect(chunks).toHaveLength(0);
  });

  it('produces one chunk for a single section', () => {
    const body = 'A'.repeat(100);
    const md = `# Overview\n\n${body}\n`;
    const chunks = chunkMarkdown(md, 'docs/overview.md', MAX);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].headingTrail).toEqual(['Overview']);
    expect(chunks[0].filePath).toBe('docs/overview.md');
    expect(chunks[0].text).toContain('# Overview');
  });

  it('builds correct heading trail for nested headings', () => {
    const md = [
      '# Module A',
      '',
      'A'.repeat(100),
      '',
      '## Sub-section',
      '',
      'B'.repeat(100),
      '',
      '### Deep section',
      '',
      'C'.repeat(100),
    ].join('\n');

    const chunks = chunkMarkdown(md, 'test.md', MAX);
    expect(chunks[0].headingTrail).toEqual(['Module A']);
    expect(chunks[1].headingTrail).toEqual(['Module A', 'Sub-section']);
    expect(chunks[2].headingTrail).toEqual(['Module A', 'Sub-section', 'Deep section']);
  });

  it('resets heading trail when a higher-level heading appears', () => {
    const md = [
      '# Module A',
      '',
      'A'.repeat(100),
      '',
      '## Sub-section',
      '',
      'B'.repeat(100),
      '',
      '# Module B',
      '',
      'C'.repeat(100),
    ].join('\n');

    const chunks = chunkMarkdown(md, 'test.md', MAX);
    const moduleBChunk = chunks.find(c => c.headingTrail[0] === 'Module B');
    expect(moduleBChunk).toBeDefined();
    expect(moduleBChunk!.headingTrail).toEqual(['Module B']);
  });

  it('splits oversized sections at paragraph breaks', () => {
    const para = 'Word '.repeat(60).trim(); // ~300 chars per paragraph
    const md = [
      '# Big Section',
      '',
      para, '', para, '', para, '', para, '', para, '', para,
    ].join('\n');

    const chunks = chunkMarkdown(md, 'test.md', 500);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.text.length).toBeLessThanOrEqual(600); // some tolerance for split logic
    }
  });

  it('preserves charStart as byte offset of section start', () => {
    const md = '# First\n\n' + 'A'.repeat(100) + '\n\n# Second\n\n' + 'B'.repeat(100) + '\n';
    const chunks = chunkMarkdown(md, 'test.md', MAX);
    expect(chunks[0].charStart).toBe(0);
    expect(chunks[1].charStart).toBeGreaterThan(0);
  });
});
