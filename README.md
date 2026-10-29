# D Design Office — V5

这是 V5 的独立完整网站，包含 HTML、CSS、JavaScript、作品图片和字体。首页 `index.html` 位于仓库根目录，不依赖另外三个版本或总合集。

## 独立部署到 Netlify

1. 在 Netlify 新建项目，选择本仓库 `ddo-website-v5`。
2. 分支选择 `main`。
3. Base directory 留空，Build command 留空，Publish directory 填 `.`。
4. 点击 Deploy。Netlify 会为这个网站单独分配网址，可在项目设置中修改名称。

本仓库已包含 `netlify.toml`，通常可自动识别发布目录。将另外三个仓库分别新建为另外三个 Netlify 项目，即可获得四个独立网址。

## 本地预览

在仓库根目录运行 `python3 -m http.server 8000`，打开 http://localhost:8000/ 。

## 内容权利

D Design Office 品牌、作品照片和设计内容由各自权利人保留权利。
