import { Marked, Renderer } from './vendor/marked/marked.esm.js?v=18.3.0';

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  }[char]));
}

function safeUrl(value, image = false) {
  const href = String(value).trim();
  if (!href || /[\u0000-\u001f\u007f]/.test(href)) return null;
  try {
    const url = new URL(href, 'https://markdown.invalid/');
    if (!['http:', 'https:', ...(image ? [] : ['mailto:'])].includes(url.protocol)) return null;
    return href;
  } catch { return null; }
}

// Use the same local parser in the preview and saved notes. Raw HTML stays text,
// and every generated link or image URL is checked before creating an element.
const markdown = new Marked({
  gfm: true,
  breaks: true,
  async: false,
  renderer: {
    html({ text }) { return escapeHtml(text); },
    heading({ tokens, depth }) {
      const level = Math.min(depth + 1, 6);
      return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>\n`;
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const url = safeUrl(href);
      if (!url) return text;
      return `<a href="${escapeHtml(url)}"${title ? ` title="${escapeHtml(title)}"` : ''} target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
    image({ href, title, text }) {
      const url = safeUrl(href, true);
      if (!url) return escapeHtml(text);
      return `<img src="${escapeHtml(url)}" alt="${escapeHtml(text)}"${title ? ` title="${escapeHtml(title)}"` : ''} loading="lazy" decoding="async">`;
    },
    table(token) {
      return `<div class="markdown-table-scroll" tabindex="0" aria-label="表格">${Renderer.prototype.table.call(this, token)}</div>`;
    },
  },
});

export function renderNotes(value) {
  return markdown.parse(String(value));
}
