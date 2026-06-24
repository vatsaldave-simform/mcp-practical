import 'dotenv/config';
import { getConfig } from '../src/lib/config.js';
import { Embedder } from '../src/lib/embedder.js';
import { VectorStore } from '../src/lib/vector-store.js';

const cfg = getConfig();
const embedder = new Embedder(cfg.google.apiKey);
const store = new VectorStore('./kb-index-test');

await store.init();

const inputs = [
  'Payments refund flow',
  'User authentication with OAuth',
  'Database migrations guide',
];
const vectors = await embedder.embedBatch(inputs);
const chunks = inputs.map((t, i) => ({
  text: t,
  filePath: 'test.md',
  headingTrail: [`Section ${i}`],
  charStart: 0,
}));

await store.upsertFile('test.md', chunks, vectors);

const queryVec = (await embedder.embedBatch(['how to refund a payment']))[0];
const results = await store.query(queryVec, 3);

console.log('Top result:', results[0]);
console.log('Score:', results[0].score);
console.log('Stats:', await store.stats());

if (results[0].text !== 'Payments refund flow') {
  console.error('FAIL: expected "Payments refund flow" as top result');
  process.exit(1);
}
if (results[0].score < 0.8) {
  console.error(`FAIL: score ${results[0].score} < 0.8`);
  process.exit(1);
}
console.log('PASS');
