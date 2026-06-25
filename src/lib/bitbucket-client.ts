import type { KbConfig } from './config.js';

interface DirEntry {
  type: 'commit_file' | 'commit_directory';
  path: string;
}

interface DirListing {
  values: DirEntry[];
  next?: string;
}

export class BitbucketClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly branch: string;
  private readonly docsPath: string;

  constructor(cfg: KbConfig['bitbucket']) {
    this.baseUrl = `https://api.bitbucket.org/2.0/repositories/${cfg.workspace}/${cfg.repo}`;
    this.authHeader = `Basic ${Buffer.from(`${cfg.email}:${cfg.apiToken}`).toString('base64')}`;
    this.branch = cfg.branch;
    this.docsPath = cfg.docsPath;
  }

  async listMarkdownFiles(): Promise<string[]> {
    const results: string[] = [];
    await this.crawlDirectory(this.docsPath, results);
    return results;
  }

  async fetchFile(filePath: string): Promise<string> {
    const url = `${this.baseUrl}/src/${this.branch}/${filePath}`;
    const res = await fetch(url, { headers: { Authorization: this.authHeader } });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Bitbucket ${res.status} fetching file: ${filePath} — ${body}`);
    }
    return res.text();
  }

  private async crawlDirectory(dirPath: string, results: string[]): Promise<void> {
    const pathSegment = dirPath ? `${dirPath.replace(/\/$/, '')}/` : '';
    let nextUrl: string | null =
      `${this.baseUrl}/src/${this.branch}/${pathSegment}?pagelen=100`;

    while (nextUrl) {
      const res = await fetch(nextUrl, {
        headers: { Authorization: this.authHeader, Accept: 'application/json' },
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Bitbucket ${res.status} listing directory: ${pathSegment || '(root)'} — ${body}`);
      }

      const data = (await res.json()) as DirListing;

      for (const entry of data.values) {
        if (entry.type === 'commit_directory') {
          await this.crawlDirectory(entry.path, results);
        } else if (entry.type === 'commit_file' && entry.path.endsWith('.md')) {
          results.push(entry.path);
        }
      }

      nextUrl = data.next ?? null;
    }
  }
}
