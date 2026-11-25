import {
  STORAGE_KEY, categories, statuses, defaultPapers, categoryLabel, statusLabel, tagKey,
  normalizeTags, normalizePapers, loadPapers, savePapers, filterPapers, collectTags, sourceInfo,
} from './reading-store.js';
import { escapeHtml as esc, renderNotes } from './reading-markdown.js';

const $ = selector => document.querySelector(selector);
const library = $('#paperLibrary');
const detail = $('#paperDetail');
let papers = [];
let readOnly = false;

function message(text) {
  $('#libraryMessage').textContent = text;
  $('#libraryMessage').hidden = !text;
}

try {
  papers = loadPapers(localStorage);
} catch {
  papers = normalizePapers(defaultPapers);
  readOnly = true;
  message('无法读取浏览器里的阅读记录，暂时显示示例。编辑已暂停，以免覆盖原有内容。');
}

function updatePaper(id, changes) {
  if (readOnly) throw new Error('原有记录尚未成功读取，暂时无法保存。');
  const latest = loadPapers(localStorage);
  let updated;
  if (id) {
    if (!latest.some(paper => paper.id === id)) throw new Error('这篇文章已不在阅读库中，请刷新后重试。');
    updated = latest.map(paper => paper.id === id ? { ...paper, ...changes } : paper);
  } else {
    updated = [{ ...changes, id: crypto.randomUUID() }, ...latest];
  }
  try { savePapers(localStorage, updated); }
  catch { throw new Error('未能保存，请检查浏览器是否允许储存数据。你填写的内容仍保留在这里。'); }
  papers = updated;
}

function readView(search = location.search) {
  const params = new URLSearchParams(search);
  return {
    category: categories.some(item => item.id === params.get('category')) ? params.get('category') : 'all',
    status: statuses.some(item => item.id === params.get('status')) ? params.get('status') : 'all',
    query: params.get('q') || '',
    tags: normalizeTags(params.getAll('tag')),
  };
}

function viewParams(view) {
  const params = new URLSearchParams();
  if (view.category !== 'all') params.set('category', view.category);
  if (view.status !== 'all') params.set('status', view.status);
  if (view.query) params.set('q', view.query);
  view.tags.forEach(tag => params.append('tag', tag));
  return params;
}

let view = readView();

function detailLink(paper) {
  const params = new URLSearchParams({ id: paper.id });
  const from = viewParams(view).toString();
  if (from) params.set('from', from);
  return `paper.html?${params}`;
}

function sourceLink(paper) {
  const source = sourceInfo(paper.url, paper.sourceName);
  return source ? `<a class="paper-open" href="${esc(source.href)}" target="_blank" rel="noreferrer">${esc(source.label)} <span aria-hidden="true">↗</span></a>` : '';
}

function excerpt(paper) {
  return paper.notes.trim()
    ? paper.notes.replace(/[#*>`\[\]]/g, '').replace(/\s+/g, ' ').trim().slice(0, 150)
    : paper.summary;
}

function renderLibrary() {
  const isQueue = view.category === 'all' && view.status === 'queued';
  const scope = filterPapers(papers, { category: view.category, status: view.status });
  const visible = filterPapers(papers, view);
  const name = view.category === 'all' ? '全部文章' : categoryLabel(view.category);
  $('#collectionTitle').textContent = isQueue ? '待读列表' : name + (view.status === 'all' ? '' : ` · ${statusLabel(view.status)}`);
  $('#resultCount').textContent = `${visible.length} / ${scope.length} 篇`;
  $('#searchInput').value = view.query;
  $('#statusFilter').value = view.status;
  document.querySelectorAll('[data-count]').forEach(node => {
    const key = node.dataset.count;
    node.textContent = key === 'all' ? papers.length : papers.filter(paper => key === 'queued' ? paper.status === key : paper.category === key).length;
  });
  document.querySelectorAll('.category-nav [data-category]').forEach(button => {
    const active = button.dataset.category === view.category && !isQueue;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $('#queueView').classList.toggle('active', isQueue);
  $('#queueView').setAttribute('aria-pressed', String(isQueue));
  const tags = collectTags(scope);
  for (const tag of view.tags) {
    if (!tags.some(item => tagKey(item.tag) === tagKey(tag))) tags.push({ tag, count: 0 });
  }
  $('#tagFilters').innerHTML = tags.length ? tags.map(({ tag, count }) => {
    const active = view.tags.some(value => tagKey(value) === tagKey(tag));
    return `<button class="tag-chip${active ? ' selected' : ''}" type="button" data-tag="${esc(tag)}" aria-pressed="${active}">${esc(tag)} <small>${count}</small></button>`;
  }).join('') : '<span class="no-tags">还没有 tag</span>';
  $('#clearFilters').hidden = !view.query && !view.tags.length;
  $('#tagFilterHint').hidden = view.tags.length < 2;
  $('#paperList').innerHTML = visible.length ? visible.map(paper => `
    <article class="paper-card">
      <div class="paper-card-body">
        <span class="paper-category">${esc(categoryLabel(paper.category))}</span>
        <h3 class="paper-title"><a href="${esc(detailLink(paper))}">${esc(paper.title)}</a></h3>
        <p class="paper-meta">${esc(paper.meta)}</p>
        ${excerpt(paper) ? `<p class="paper-summary">${esc(excerpt(paper))}</p>` : ''}
        <div class="paper-tags">${paper.tags.map(tag => `<button class="paper-tag" type="button" data-tag="${esc(tag)}" aria-pressed="${view.tags.some(value => tagKey(value) === tagKey(tag))}">${esc(tag)}</button>`).join('')}</div>
        ${sourceLink(paper)}
      </div>
      <div class="paper-card-actions">
        <span class="paper-status ${paper.status}"><i aria-hidden="true"></i>${esc(statusLabel(paper.status))}</span>
        <button class="entry-edit" type="button" data-edit="${esc(paper.id)}" aria-label="编辑 ${esc(paper.title)}" ${readOnly ? 'disabled' : ''}>编辑</button>
      </div>
    </article>`).join('') : `<div class="reading-empty"><span aria-hidden="true">○</span><h3>${scope.length ? '没有匹配的文章' : '这里还留着空白'}</h3><p>${scope.length ? '试试其他关键词，或减少几个 tag。' : isQueue ? '把想读的文章设为“待读”，它们就会出现在这里。' : '把下一篇想读的文章放进这个分类。'}</p>${scope.length ? '<button type="button" class="clear-filters" data-clear>清除搜索和 tag</button>' : ''}</div>`;
  history.replaceState(null, '', `reading-paper.html${viewParams(view).size ? '?' + viewParams(view) : ''}`);
}

function changeView(category, status = 'all') {
  view = { category, status, query: '', tags: [] };
  renderLibrary();
}

function toggleTag(tag) {
  const exists = view.tags.some(value => tagKey(value) === tagKey(tag));
  view.tags = exists ? view.tags.filter(value => tagKey(value) !== tagKey(tag)) : [...view.tags, tag];
  renderLibrary();
}

function clearFilters() {
  view.query = '';
  view.tags = [];
  renderLibrary();
}

function notesEditor(id, rows, label) {
  return `<div class="markdown-editor">
    <div class="markdown-toolbar" role="group" aria-label="总结编辑模式">
      <button type="button" data-markdown-mode="write" aria-pressed="true">编写 Markdown</button>
      <button type="button" data-markdown-mode="preview" aria-pressed="false" aria-controls="${id}Preview">预览</button>
    </div>
    <div data-markdown-write>
      <label for="${id}">${label}（Markdown）</label>
      <textarea id="${id}" name="notes" rows="${rows}" aria-describedby="${id}Help" placeholder="# 核心观点\n\n写下你的理解、问题和思考。"></textarea>
    </div>
    <div id="${id}Preview" class="notes-content markdown-preview" aria-label="Markdown 预览" tabindex="0" hidden></div>
    <p class="field-help" id="${id}Help">支持标题、加粗、斜体、列表、任务列表、引用、表格、链接、图片和代码块。</p>
  </div>`;
}

function bindNotesEditor(editor) {
  const input = editor.querySelector('textarea');
  const write = editor.querySelector('[data-markdown-write]');
  const preview = editor.querySelector('.markdown-preview');
  const buttons = editor.querySelectorAll('[data-markdown-mode]');
  function setMode(mode) {
    const showPreview = mode === 'preview';
    if (showPreview) preview.innerHTML = input.value.trim()
      ? renderNotes(input.value)
      : '<p class="markdown-preview-empty">写下 Markdown 内容后，可以在这里查看排版。</p>';
    write.hidden = showPreview;
    preview.hidden = !showPreview;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.markdownMode === mode)));
  }
  buttons.forEach(button => button.addEventListener('click', () => setMode(button.dataset.markdownMode)));
  return () => setMode('write');
}

const dialog = document.createElement('dialog');
dialog.className = 'modal entry-dialog';
dialog.setAttribute('aria-labelledby', 'modalTitle');
dialog.innerHTML = `
  <button class="modal-close" type="button" aria-label="关闭">×</button>
  <p class="eyebrow dark-eyebrow">READING ENTRY</p>
  <h2 id="modalTitle">添加文章</h2>
  <form id="paperForm">
    <label>标题<input required name="title" placeholder="论文、文章或博客的标题" maxlength="500"></label>
    <div class="form-row">
      <label>类别<select name="category">${categories.map(item => `<option value="${item.id}">${item.label}</option>`).join('')}</select></label>
      <label>阅读状态<select name="status">${statuses.map(item => `<option value="${item.id}">${item.label}</option>`).join('')}</select></label>
    </div>
    <label>作者 / 年份<input name="meta" placeholder="作者 · 2026"></label>
    <label>来源链接<input name="url" type="url" pattern="https?://.+" placeholder="https://arxiv.org/abs/..."></label>
    <label>来源名称（非 arXiv，可选）<input name="sourceName" placeholder="例如：Anthropic、某某的博客"></label>
    <p class="source-preview" id="sourcePreview"></p>
    <label>Tags<input name="tags" placeholder="例如：reasoning, RLVR, agent"></label>
    <p class="field-help">多个 tag 用逗号分隔，一篇文章可以有多个 tag。</p>
    ${notesEditor('entryNotesInput', 6, '我的总结')}
    <p class="form-error" role="status" hidden></p>
    <div class="modal-actions"><button class="text-link dark-text" type="button" data-cancel>取消</button><button class="button button-dark" type="submit">保存文章 →</button></div>
  </form>`;
document.body.append(dialog);
const form = dialog.querySelector('form');
const resetEntryNotesEditor = bindNotesEditor(dialog.querySelector('.markdown-editor'));
let editingId = null;

function updateSourcePreview() {
  const source = sourceInfo(form.elements.url.value, form.elements.sourceName.value);
  dialog.querySelector('#sourcePreview').textContent = source ? `链接将显示为 ${source.label}` : '';
}

function openEntry(paper = null) {
  if (readOnly) return;
  editingId = paper?.id || null;
  form.reset();
  const initial = paper || { category: view.category === 'all' ? 'frontier' : view.category, status: 'queued' };
  for (const field of ['title', 'category', 'status', 'meta', 'url', 'sourceName', 'notes']) {
    if (initial[field] !== undefined) form.elements[field].value = initial[field];
  }
  form.elements.tags.value = (paper?.tags || []).join(', ');
  resetEntryNotesEditor();
  dialog.querySelector('#modalTitle').textContent = paper ? '编辑文章' : '添加文章';
  dialog.querySelector('.form-error').hidden = true;
  updateSourcePreview();
  dialog.showModal();
}

dialog.querySelector('.modal-close').addEventListener('click', () => dialog.close());
dialog.querySelector('[data-cancel]').addEventListener('click', () => dialog.close());
form.elements.url.addEventListener('input', updateSourcePreview);
form.elements.sourceName.addEventListener('input', updateSourcePreview);
form.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const title = String(data.get('title')).trim();
  if (!title) { form.elements.title.focus(); return; }
  const changes = {
    title, category: data.get('category'), status: data.get('status'),
    meta: String(data.get('meta')).trim(), url: String(data.get('url')).trim(),
    sourceName: String(data.get('sourceName')).trim(), tags: normalizeTags(data.get('tags')),
    notes: String(data.get('notes')),
  };
  try {
    updatePaper(editingId, changes);
    dialog.close();
    if (library) renderLibrary(); else renderDetail();
    message('文章已保存。');
  } catch (error) {
    const feedback = dialog.querySelector('.form-error');
    feedback.textContent = error.message;
    feedback.hidden = false;
  }
});

function renderDetail() {
  const params = new URLSearchParams(location.search);
  const paper = papers.find(item => item.id === params.get('id'));
  const from = viewParams(readView(params.get('from') || '')).toString();
  $('#backToLibrary').href = `reading-paper.html${from ? '?' + from : ''}`;
  if (!paper) {
    detail.innerHTML = '<div class="reading-empty"><h1>未找到这篇文章</h1><p>这篇内容可能还未在当前浏览器中保存。</p><a href="reading-paper.html">返回论文库 →</a></div>';
    return;
  }
  document.title = `${paper.title} · 阅读总结`;
  detail.innerHTML = `
    <header class="paper-detail-header">
      <div class="detail-topline"><a class="paper-category" href="reading-paper.html?category=${paper.category}">${esc(categoryLabel(paper.category))}</a><button type="button" id="editEntry" class="entry-edit" ${readOnly ? 'disabled' : ''}>编辑文章信息</button></div>
      <h1>${esc(paper.title)}</h1>
      <p class="detail-meta">${esc(paper.meta)}</p>
      <div class="detail-source-row">${sourceLink(paper)}<label class="status-filter">阅读状态<select id="detailStatus" ${readOnly ? 'disabled' : ''}>${statuses.map(item => `<option value="${item.id}" ${paper.status === item.id ? 'selected' : ''}>${item.label}</option>`).join('')}</select></label></div>
      <div class="paper-tags">${paper.tags.map(tag => `<a class="paper-tag" href="reading-paper.html?${new URLSearchParams({ category: paper.category, tag })}">${esc(tag)}</a>`).join('')}</div>
    </header>
    <section class="notes-panel" aria-labelledby="notesTitle">
      <div class="notes-heading"><h2 id="notesTitle">我的总结</h2><button type="button" class="notes-edit" id="editNotes" ${readOnly ? 'disabled' : ''}>${paper.notes.trim() ? '编辑总结' : '写总结'} <span aria-hidden="true">↗</span></button></div>
      <div class="notes-content" id="notesContent">${paper.notes.trim() ? renderNotes(paper.notes) : '<div class="notes-empty"><p>还没有写下这篇文章的总结。</p><span>从一个值得记住的观点，或一个还没想明白的问题开始。</span></div>'}</div>
      <form id="notesForm" class="notes-form" hidden>
        ${notesEditor('notesInput', 17, '阅读总结')}
        <p class="form-error" id="notesError" role="status" hidden></p>
        <div class="notes-form-actions"><button type="button" class="text-link dark-text" id="cancelNotes">取消</button><button type="submit" class="button button-dark">保存总结 →</button></div>
      </form>
    </section>`;
  $('#editEntry').addEventListener('click', () => openEntry(papers.find(item => item.id === paper.id)));
  $('#detailStatus').addEventListener('change', event => {
    try { updatePaper(paper.id, { status: event.target.value }); message(`已设为${statusLabel(event.target.value)}。`); }
    catch (error) { event.target.value = papers.find(item => item.id === paper.id).status; message(error.message); }
  });
  $('#notesInput').value = paper.notes;
  bindNotesEditor($('#notesForm .markdown-editor'));
  $('#editNotes').addEventListener('click', () => {
    $('#notesContent').hidden = true;
    $('#notesForm').hidden = false;
    $('#editNotes').hidden = true;
    $('#editEntry').disabled = true;
    $('#notesInput').focus();
  });
  $('#cancelNotes').addEventListener('click', renderDetail);
  $('#notesForm').addEventListener('submit', event => {
    event.preventDefault();
    try {
      updatePaper(paper.id, { notes: $('#notesInput').value });
      renderDetail();
      message('总结已保存。');
    } catch (error) {
      $('#notesError').textContent = error.message;
      $('#notesError').hidden = false;
    }
  });
}

if (library) {
  $('#openModal').disabled = readOnly;
  $('#openModal').addEventListener('click', () => openEntry());
  $('.category-nav').addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (button) changeView(button.dataset.category);
  });
  $('#queueView').addEventListener('click', () => changeView('all', 'queued'));
  $('#searchInput').addEventListener('input', event => { view.query = event.target.value; renderLibrary(); });
  $('#statusFilter').addEventListener('change', event => { view.status = event.target.value; view.tags = []; renderLibrary(); });
  $('#clearFilters').addEventListener('click', clearFilters);
  library.addEventListener('click', event => {
    const tag = event.target.closest('[data-tag]');
    const edit = event.target.closest('[data-edit]');
    if (tag) toggleTag(tag.dataset.tag);
    if (edit) openEntry(papers.find(paper => paper.id === edit.dataset.edit));
    if (event.target.closest('[data-clear]')) clearFilters();
  });
  renderLibrary();
} else if (detail) renderDetail();

window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY) return;
  try { papers = loadPapers(localStorage); }
  catch { message('另一个页面的记录未能读取，请刷新后重试。'); return; }
  if (library) renderLibrary();
  if (detail && $('#notesForm')?.hidden && !dialog.open) renderDetail();
});
