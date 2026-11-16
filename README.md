# 行则将至 · 行读

一个静态的个人论文阅读库，灵感来自 Nature Will 的留白、深色画布和动态艺术，同时保留“raw → wiki → index”的知识库思路。

## 本地运行

无需安装依赖，在本目录执行：

```bash
python3 -m http.server 4173
```

然后打开 <http://localhost:4173>。

论文页的新增条目会保存在浏览器 `localStorage` 中。当前页面可以直接部署到 GitHub Pages：将 `Action` 目录作为仓库根目录推送，然后在仓库 Settings → Pages 中选择 `main` 分支和 `/ (root)`。

## 添加首页下方的文字

首页 `index.html` 的 `knowledge-board` 是一块可扩展的自由画布。复制一个 `.ink-note`，修改文字和三个参数即可：

- `data-delay`：进入画布后的延迟毫秒数
- `data-size`：`large`、`medium` 或 `small`
- `data-tilt`：轻微旋转角度，例如 `-4` 或 `2`

页面使用 `IntersectionObserver`，画布进入视口后只播放一次显现动画；不需要手动改 JavaScript。
