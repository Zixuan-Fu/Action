export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  }[char]));
}

function inline(text) {
  const pattern = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\[[^\]\n]+\]\(https?:\/\/[^\s)]+\))/g;
  let result = '';
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    result += escapeHtml(text.slice(cursor, match.index));
    const token = match[0];
    if (token.startsWith('`')) result += `<code>${escapeHtml(token.slice(1, -1))}</code>`;
    else if (token.startsWith('**')) result += `<strong>${escapeHtml(token.slice(2, -2))}</strong>`;
    else {
      const link = token.match(/^\[([^\]]+)\]\((.+)\)$/);
      result += `<a href="${escapeHtml(link[2])}" target="_blank" rel="noreferrer">${escapeHtml(link[1])}</a>`;
    }
    cursor = match.index + token.length;
  }
  return result + escapeHtml(text.slice(cursor));
}

// Notes accept a small Markdown subset; raw HTML is always displayed as text.
export function renderNotes(markdown) {
  const lines = String(markdown).replace(/\r\n?/g, '\n').split('\n');
  let html = '';
  let paragraph = [];
  let list = '';
  let code = null;
  function flush() {
    if (paragraph.length) html += `<p>${paragraph.map(inline).join('<br>')}</p>`;
    paragraph = [];
    if (list) html += `</${list}>`;
    list = '';
  }
  for (const line of lines) {
    if (line.startsWith('```')) {
      flush();
      if (code === null) code = [];
      else { html += `<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`; code = null; }
      continue;
    }
    if (code !== null) { code.push(line); continue; }
    if (!line.trim()) { flush(); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const item = line.match(/^\s*(?:([-*])|\d+[.)])\s+(.+)$/);
    if (heading) {
      flush();
      const level = heading[1].length + 1;
      html += `<h${level}>${inline(heading[2])}</h${level}>`;
    } else if (item) {
      const type = item[1] ? 'ul' : 'ol';
      if (list !== type) { flush(); html += `<${type}>`; list = type; }
      html += `<li>${inline(item[2])}</li>`;
    } else if (line.startsWith('> ')) {
      flush();
      html += `<blockquote>${inline(line.slice(2))}</blockquote>`;
    } else {
      if (list) flush();
      paragraph.push(line);
    }
  }
  flush();
  if (code !== null) html += `<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`;
  return html;
}
