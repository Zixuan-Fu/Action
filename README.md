# 行则将至 · 行读

一个静态的个人论文阅读库，灵感来自 Nature Will 的留白、自由排版和动态艺术，采用暖白纸张底色，同时保留“raw → wiki → index”的知识库思路。

## 在线访问与部署

网站：<https://zixuan-fu.github.io/Action/>

论文库：<https://zixuan-fu.github.io/Action/reading-paper.html>

GitHub 仓库：<https://github.com/Zixuan-Fu/Action>

仓库使用 GitHub Actions 部署 GitHub Pages；推送到 `main` 后会自动更新，部署进度可在仓库的 Actions 页面查看。Pages 的部署来源设为 GitHub Actions。

论文页的新增条目、分类、阅读状态和总结会保存在当前浏览器的 `localStorage` 中，不会同步到 GitHub 或其他设备。线上网址与 localhost 的记录各自独立。

## 阅读库

- 内容分为“前沿模型、RL、infra、RSI”，默认可查看全部文章；待读列表汇总所有类别中尚未阅读的内容。
- 在类别内搜索标题、作者、来源、tag 和总结；可以同时选择多个 tag，筛出同时包含这些 tag 的文章。
- 添加或编辑文章时，可以修改类别、阅读状态、来源、多个 tag 和阅读总结。
- 点击标题进入 `paper.html?id=文章ID` 查看自己的总结；支持编辑总结及基础 Markdown 排版。返回列表会保留原来的类别与筛选。
- arXiv 来源显示编号并链接到摘要页；其他来源显示站点名，也可以手动指定来源名称。
- 原来的记录沿用 `xing-paper-library` 存储键，自动补上类别，保留已有摘记和其他字段。初始示例在 `assets/reading-store.js` 中，未代写个人总结。

数据逻辑检查：`npm test`，无需安装依赖。

## 本地运行

无需安装依赖，在本目录执行：

```bash
python3 -m http.server 4173
```

然后打开 <http://localhost:4173>。

这台 Mac 已配置登录后自动启动本地服务，配置文件为 `~/Library/LaunchAgents/com.fzx.action-site.plist`。需要重新启动时执行：

```bash
launchctl kickstart -k "gui/$(id -u)/com.fzx.action-site"
```

## 添加首页下方的文字

首页 `index.html` 的 `knowledge-board` 是一块可扩展的自由画布。复制一个 `.ink-note`，修改文字和三个参数即可：

- `data-delay`：进入画布后的延迟毫秒数
- `data-size`：`large`、`medium` 或 `small`
- `data-tilt`：轻微旋转角度，例如 `-4` 或 `2`

页面使用 `IntersectionObserver`，画布进入视口后只播放一次显现动画；不需要手动改 JavaScript。
