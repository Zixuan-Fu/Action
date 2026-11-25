# Bundled libraries

- `marked/`: [Marked](https://github.com/markedjs/marked) 18.3.0, MIT license.
  Files are copied from the official npm package `marked@18.3.0`.
  The browser loads these local files, so Markdown rendering does not depend on a CDN.

`../reading-markdown.js` disables raw HTML and checks link and image protocols.
