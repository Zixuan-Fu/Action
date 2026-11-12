# 行则将至 · 行读

一个静态的个人论文阅读库，灵感来自 Nature Will 的留白、深色画布和动态艺术，同时保留“raw → wiki → index”的知识库思路。

## 本地运行

无需安装依赖，在本目录执行：

```bash
python3 -m http.server 4173
```

然后打开 <http://localhost:4173>。

论文页的新增条目会保存在浏览器 `localStorage` 中。当前页面可以直接部署到 GitHub Pages：将 `Action` 目录作为仓库根目录推送，然后在仓库 Settings → Pages 中选择 `main` 分支和 `/ (root)`。
