import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEY, defaultPapers, normalizePapers, normalizeTags, loadPapers, savePapers,
  filterPapers, collectTags, sourceInfo,
} from '../assets/reading-store.js';
import { renderNotes } from '../assets/reading-markdown.js';

function memoryStorage(initial = null) {
  let value = initial;
  return {
    getItem(key) { assert.equal(key, STORAGE_KEY); return value; },
    setItem(key, next) { assert.equal(key, STORAGE_KEY); value = next; },
  };
}

test('existing records gain categories without losing notes, IDs or custom data', () => {
  const original = {
    id: 'abc', title: 'RLVR experiments', tags: ['RLVR', 'reasoning'], status: 'reading',
    summary: '旧摘记', notes: '# 我的实验\n\n保持原文。', customField: { keep: true },
  };
  const storage = memoryStorage(JSON.stringify([original]));
  const papers = loadPapers(storage);
  assert.equal(papers[0].category, 'rl');
  assert.equal(papers[0].notes, original.notes);
  assert.equal(papers[0].summary, original.summary);
  assert.equal(papers[0].id, original.id);
  assert.deepEqual(papers[0].customField, original.customField);
  assert.equal(storage.getItem(STORAGE_KEY), JSON.stringify([original]), 'loading never rewrites stored data');
});

test('a saved empty library stays empty and corrupt data is not silently replaced', () => {
  assert.deepEqual(loadPapers(memoryStorage('[]')), []);
  const corrupt = memoryStorage('{broken');
  assert.throws(() => loadPapers(corrupt));
  assert.equal(corrupt.getItem(STORAGE_KEY), '{broken');
  assert.throws(() => normalizePapers([null]));
});

test('legacy colliding IDs become stable unique detail destinations', () => {
  const legacy = [{ id: '123', title: 'first' }, { id: '123', title: 'second' }, { id: '123-2', title: 'third' }];
  const first = normalizePapers(legacy);
  assert.equal(new Set(first.map(paper => paper.id)).size, 3);
  assert.deepEqual(first.map(paper => paper.id), normalizePapers(legacy).map(paper => paper.id));
});

test('category, status, search and multiple tags can be combined', () => {
  const papers = normalizePapers([
    { id: 'a', title: 'A', category: 'rl', status: 'queued', tags: ['agent', 'RLVR'], notes: '分布式奖励' },
    { id: 'b', title: 'B', category: 'rl', status: 'done', tags: ['agent', 'RLVR'], notes: '分布式奖励' },
    { id: 'c', title: 'C', category: 'infra', status: 'queued', tags: ['agent'] },
  ]);
  const found = filterPapers(papers, { category: 'rl', status: 'queued', tags: ['AGENT', 'rlvr'], query: '分布式 RLVR' });
  assert.deepEqual(found.map(paper => paper.id), ['a']);
  assert.equal(filterPapers(papers, { tags: ['agent', 'missing'] }).length, 0);
  assert.equal(collectTags(papers).find(item => item.tag === 'agent').count, 3);
});

test('Chinese separators and case variants produce one usable tag per topic', () => {
  assert.deepEqual(normalizeTags('RLVR, agent，rlvr；reasoning\n agent '), ['RLVR', 'agent', 'reasoning']);
});

test('moving an entry out of the waitlist preserves its summary after reload', () => {
  const storage = memoryStorage();
  const papers = loadPapers(storage);
  const queued = papers.find(paper => paper.status === 'queued');
  queued.status = 'done';
  queued.notes = '# 我的总结\n\n- 观点一\n- 观点二';
  savePapers(storage, papers);
  const reloaded = loadPapers(storage);
  assert.equal(filterPapers(reloaded, { status: 'queued' }).length, 0);
  assert.equal(reloaded.find(paper => paper.id === queued.id).notes, queued.notes);
  assert.equal(reloaded.length, defaultPapers.length);
});

test('arXiv abstract, PDF, HTML and legacy IDs show their number and link to the abstract', () => {
  for (const url of ['https://arxiv.org/abs/1706.03762', 'https://arxiv.org/pdf/1706.03762.pdf', 'https://arxiv.org/html/1706.03762']) {
    assert.deepEqual(sourceInfo(url), { label: 'arXiv:1706.03762', href: 'https://arxiv.org/abs/1706.03762' });
  }
  assert.deepEqual(sourceInfo('https://export.arxiv.org/pdf/hep-th/9901001v2'), {
    label: 'arXiv:hep-th/9901001v2', href: 'https://arxiv.org/abs/hep-th/9901001v2',
  });
});

test('other sources use a concrete name while unsafe links remain unlinked', () => {
  assert.equal(sourceInfo('https://www.incompleteideas.net/IncIdeas/BitterLesson.html').label, 'Incomplete Ideas');
  assert.equal(sourceInfo('https://example.com/post', '我的博客').label, '我的博客');
  assert.equal(sourceInfo('https://blog.example.org/post').label, 'blog.example.org');
  assert.equal(sourceInfo('javascript:alert(1)'), null);
  assert.equal(sourceInfo('not a link'), null);
});

test('summaries render readable headings, lists and code while keeping raw HTML inert', () => {
  const html = renderNotes('# 核心观点\n\n**计算**与 `数据`\n\n- 第一条\n- 第二条\n\n> 一个问题\n\n```html\n<script>bad()</script>\n```\n\n<img src=x onerror=bad()>');
  assert.match(html, /<h2>核心观点<\/h2>/);
  assert.match(html, /<strong>计算<\/strong>/);
  assert.match(html, /<ul><li>第一条<\/li><li>第二条<\/li><\/ul>/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<img|<script/);
  assert.doesNotMatch(renderNotes('[bad](javascript:alert(1))'), /<a /);
  assert.match(renderNotes('[paper](https://arxiv.org/abs/1706.03762)'), /href="https:\/\/arxiv.org\/abs\/1706.03762"/);
});
