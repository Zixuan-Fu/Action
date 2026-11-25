export const STORAGE_KEY = 'xing-paper-library';

export const categories = [
  { id: 'frontier', label: '前沿模型' },
  { id: 'rl', label: 'RL' },
  { id: 'infra', label: 'infra' },
  { id: 'rsi', label: 'RSI' },
];

export const statuses = [
  { id: 'queued', label: '待读' },
  { id: 'reading', label: '在读' },
  { id: 'done', label: '已读' },
];

export const defaultPapers = [
  {
    id: '001', title: 'Attention Is All You Need', meta: 'Vaswani et al. · 2017',
    url: 'https://arxiv.org/abs/1706.03762', category: 'frontier',
    tags: ['transformer', 'foundation'], status: 'done', notes: '',
    summary: '以注意力机制替代循环结构，重新定义序列建模的基本单位。',
  },
  {
    id: '002', title: 'The Bitter Lesson', meta: 'Rich Sutton · 2019',
    url: 'http://www.incompleteideas.net/IncIdeas/BitterLesson.html', category: 'rl',
    sourceName: 'Incomplete Ideas', tags: ['reinforcement learning', 'scaling'],
    status: 'reading', notes: '',
    summary: '关于通用方法、计算规模和研究直觉之间关系的一则短文。',
  },
  {
    id: '003', title: 'A Survey on Large Language Model based Autonomous Agents',
    meta: 'Wang et al. · 2023', url: 'https://arxiv.org/abs/2308.11432', category: 'rsi',
    tags: ['agents', 'survey'], status: 'queued', notes: '',
    summary: '建立智能体研究的地图：记忆、规划、工具使用与反馈闭环。',
  },
];

export const categoryLabel = id => categories.find(item => item.id === id)?.label || '前沿模型';
export const statusLabel = id => statuses.find(item => item.id === id)?.label || '待读';
export const tagKey = tag => String(tag).trim().toLocaleLowerCase();

export function normalizeTags(value) {
  const tags = Array.isArray(value) ? value : String(value || '').split(/[,，;；\n]/);
  const seen = new Set();
  return tags.map(tag => String(tag).trim()).filter(tag => {
    const key = tagKey(tag);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function inferCategory(paper) {
  const known = defaultPapers.find(item => item.id === String(paper.id) && item.title === paper.title);
  if (known) return known.category;
  const text = [paper.title, ...normalizeTags(paper.tags)].join(' ').toLowerCase();
  if (/\brsi\b|self.improv|self.evolv|autonomous agent/.test(text)) return 'rsi';
  if (/\binfra\b|inference|distributed|\bvllm\b|\bgpu\b/.test(text)) return 'infra';
  if (/reinforcement|\brl\b|\brlhf\b|\brlvr\b|\bdpo\b/.test(text)) return 'rl';
  return 'frontier';
}

export function normalizePapers(papers) {
  if (!Array.isArray(papers) || papers.some(paper => !paper || typeof paper !== 'object' || Array.isArray(paper))) {
    throw new Error('阅读记录的格式不正确，请先备份浏览器中的原始记录。');
  }
  const used = new Set();
  return papers.map((paper, index) => {
    const base = String(paper.id || `entry-${index + 1}`);
    let id = base;
    while (used.has(id)) id += `-${index + 1}`;
    used.add(id);
    return {
      ...paper, id,
      title: String(paper.title || '未命名文章'),
      meta: String(paper.meta || ''), url: String(paper.url || ''),
      sourceName: String(paper.sourceName || ''),
      category: categories.some(item => item.id === paper.category) ? paper.category : inferCategory(paper),
      status: statuses.some(item => item.id === paper.status) ? paper.status : 'queued',
      tags: normalizeTags(paper.tags), summary: String(paper.summary || ''),
      notes: String(paper.notes || ''),
    };
  });
}

export function loadPapers(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  return normalizePapers(raw === null ? defaultPapers : JSON.parse(raw));
}

export function savePapers(storage, papers) {
  storage.setItem(STORAGE_KEY, JSON.stringify(papers));
}

export function filterPapers(papers, { category = 'all', status = 'all', query = '', tags = [] } = {}) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return papers.filter(paper => {
    if (category !== 'all' && paper.category !== category) return false;
    if (status !== 'all' && paper.status !== status) return false;
    const ownTags = paper.tags.map(tagKey);
    if (!tags.every(tag => ownTags.includes(tagKey(tag)))) return false;
    const text = [paper.title, paper.meta, paper.summary, paper.notes, paper.sourceName,
      paper.url, categoryLabel(paper.category), ...paper.tags].join(' ').toLocaleLowerCase();
    return words.every(word => text.includes(word));
  });
}

export function collectTags(papers) {
  const result = new Map();
  for (const paper of papers) {
    for (const tag of paper.tags) {
      const key = tagKey(tag);
      const current = result.get(key) || { tag, count: 0 };
      current.count += 1;
      result.set(key, current);
    }
  }
  return [...result.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function sourceInfo(value, sourceName = '') {
  let url;
  try {
    url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
  } catch { return null; }
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (host === 'arxiv.org' || host === 'export.arxiv.org') {
    const id = url.pathname.replace(/^\/(abs|pdf|html)\//, '').replace(/\.pdf$/, '').replace(/\/$/, '');
    if (/^(\d{4}\.\d{4,5}(v\d+)?|[a-z-]+(\.[a-z]{2})?\/\d{7}(v\d+)?)$/i.test(id)) {
      return { label: `arXiv:${id}`, href: `https://arxiv.org/abs/${id}` };
    }
  }
  const known = {
    'github.com': 'GitHub', 'huggingface.co': 'Hugging Face',
    'incompleteideas.net': 'Incomplete Ideas', 'openai.com': 'OpenAI',
    'anthropic.com': 'Anthropic', 'deepmind.google': 'Google DeepMind',
    'nature.com': 'Nature', 'distill.pub': 'Distill', 'medium.com': 'Medium',
  };
  return { label: sourceName.trim() || known[host] || host, href: url.href };
}
