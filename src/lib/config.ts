export interface KbConfig {
  bitbucket: {
    email: string;
    apiToken: string;
    workspace: string;
    repo: string;
    branch: string;
    docsPath: string;
  };
  google: {
    apiKey: string;
  };
  index: {
    dir: string;
    chunkMaxChars: number;
    searchTopK: number;
  };
}

function require(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

function optionalInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) throw new Error(`Environment variable ${key} must be an integer, got: ${raw}`);
  return parsed;
}

export function getConfig(): KbConfig {
  return {
    bitbucket: {
      email: require('BITBUCKET_EMAIL'),
      apiToken: require('BITBUCKET_API_TOKEN'),
      workspace: require('BITBUCKET_WORKSPACE'),
      repo: require('BITBUCKET_REPO'),
      branch: optional('BITBUCKET_BRANCH', 'main'),
      docsPath: optional('BITBUCKET_DOCS_PATH', ''),
    },
    google: {
      apiKey: require('GOOGLE_AI_API_KEY'),
    },
    index: {
      dir: optional('KB_INDEX_DIR', './kb-index'),
      chunkMaxChars: optionalInt('KB_CHUNK_MAX_CHARS', 1500),
      searchTopK: optionalInt('KB_SEARCH_TOP_K', 5),
    },
  };
}
