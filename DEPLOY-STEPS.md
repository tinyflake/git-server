# 🚀 Cloudflare 部署完整步骤

## 前置准备

### 1. 注册账号

- [Cloudflare](https://dash.cloudflare.com/sign-up) - 前端部署
- [Railway](https://railway.app/) - 后端部署（推荐）
  或 [Render](https://render.com/) - 后端部署（备选）

### 2. 安装工具

```bash
# 安装 Wrangler CLI（Cloudflare）
npm install -g wrangler

# 安装 Railway CLI（可选，也可以用网页部署）
npm install -g @railway/cli
```

---

## 第一步：部署后端到 Railway

### 方式 A：通过 Railway Dashboard（推荐，最简单）

1. **登录 Railway**
   - 访问 https://railway.app/
   - 使用 GitHub 账号登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 授权并选择你的仓库

3. **配置项目**
   - Railway 会自动检测到 Node.js 项目
   - 点击项目进入设置

4. **配置环境变量**
   - 进入 "Variables" 标签
   - 添加以下变量：
     ```
     NODE_ENV=production
     PORT=3000
     ```

5. **配置启动命令**
   - 进入 "Settings" 标签
   - 找到 "Deploy" 部分
   - 设置 Root Directory: `backend`
   - 设置 Start Command: `node app.js`
   - 或者使用根目录的 `railway.json` 配置（已创建）

6. **部署**
   - Railway 会自动开始部署
   - 等待部署完成（约 2-3 分钟）

7. **获取后端 URL**
   - 进入 "Settings" → "Domains"
   - 复制自动生成的域名，如：`your-app.up.railway.app`
   - 或者添加自定义域名

### 方式 B：通过 Railway CLI

```bash
# 1. 登录
railway login

# 2. 进入后端目录
cd backend

# 3. 初始化项目
railway init

# 4. 部署
railway up

# 5. 查看部署状态
railway status

# 6. 获取 URL
railway open
```

### 方式 C：部署到 Render

1. 访问 https://render.com/
2. 点击 "New +" → "Web Service"
3. 连接 GitHub 仓库
4. 配置：
   - Name: `git-server-backend`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node app.js`
5. 添加环境变量（同上）
6. 点击 "Create Web Service"

---

## 第二步：配置前端环境变量

### 1. 创建生产环境配置

在 `frontend/.env.production` 文件中（如果不存在则创建）：

```env
# 替换为你的 Railway 后端 URL
VITE_API_URL=https://your-app.up.railway.app
```

**重要**：将 `your-app.up.railway.app` 替换为你在第一步获取的实际 URL！

### 2. 测试本地构建

```bash
cd frontend
npm install
npm run build
```

确保构建成功，`dist` 目录被创建。

---

## 第三步：部署前端到 Cloudflare Pages

### 方式 A：通过 Cloudflare Dashboard（推荐）

1. **登录 Cloudflare**
   - 访问 https://dash.cloudflare.com/
   - 登录或注册账号

2. **创建 Pages 项目**
   - 左侧菜单选择 "Workers & Pages"
   - 点击 "Create application"
   - 选择 "Pages" 标签
   - 点击 "Connect to Git"

3. **连接 GitHub 仓库**
   - 授权 Cloudflare 访问你的 GitHub
   - 选择你的仓库
   - 点击 "Begin setup"

4. **配置构建设置**
   - Project name: `git-server-frontend`（或自定义）
   - Production branch: `main`（或你的主分支）
   - Framework preset: `Vue`
   - Build command: `cd frontend && npm install && npm run build`
   - Build output directory: `frontend/dist`
   - Root directory: `/` (留空或填 `/`)

5. **添加环境变量**
   - 展开 "Environment variables" 部分
   - 添加变量：
     - Variable name: `VITE_API_URL`
     - Value: `https://your-app.up.railway.app`（你的后端 URL）

6. **部署**
   - 点击 "Save and Deploy"
   - 等待构建完成（约 3-5 分钟）

7. **获取前端 URL**
   - 部署完成后，会显示你的网站 URL
   - 格式：`https://git-server-frontend.pages.dev`
   - 或者配置自定义域名

### 方式 B：通过 Wrangler CLI

```bash
# 1. 登录 Cloudflare
wrangler login

# 2. 构建前端
cd frontend
npm install
npm run build

# 3. 部署到 Pages
wrangler pages deploy dist --project-name=git-server-frontend

# 4. 查看部署
# 访问显示的 URL
```

### 方式 C：使用提供的脚本（Windows）

```bash
# 直接运行
deploy-to-cloudflare.bat
```

---

## 第四步：配置 CORS

### 1. 修改后端 CORS 配置

编辑 `backend/app.js`，找到 CORS 配置部分：

```javascript
app.use(cors())
```

修改为：

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',                    // 本地开发
    'https://git-server-frontend.pages.dev',    // Cloudflare Pages
    'https://your-custom-domain.com'            // 自定义域名（如果有）
  ],
  credentials: true
}))
```

### 2. 重新部署后端

**Railway**：
- 提交代码到 GitHub
- Railway 会自动重新部署

或者使用 CLI：
```bash
cd backend
railway up
```

**Render**：
- 提交代码到 GitHub
- Render 会自动重新部署

---

## 第五步：测试部署

### 1. 访问前端

打开浏览器，访问你的 Cloudflare Pages URL：
```
https://git-server-frontend.pages.dev
```

### 2. 测试登录

- 用户名：`admin`
- 密码：`123456`

### 3. 测试功能

- ✅ 登录成功
- ✅ 查看仓库列表
- ✅ 创建新仓库
- ✅ 查看仓库详情
- ✅ 浏览文件
- ✅ 查看提交历史

### 4. 测试 Git 操作

```bash
# 克隆仓库（使用后端 URL）
git clone https://your-app.up.railway.app/git/test-repo

# 推送代码
cd test-repo
echo "# Test" > README.md
git add .
git commit -m "Test commit"
git push origin main
# 输入用户名和密码
```

---

## 第六步：配置自定义域名（可选）

### 前端域名（Cloudflare Pages）

1. 进入 Cloudflare Pages 项目
2. 点击 "Custom domains"
3. 点击 "Set up a custom domain"
4. 输入域名（如 `git.yourdomain.com`）
5. 按照提示配置 DNS（自动完成）

### 后端域名（Railway）

1. 进入 Railway 项目设置
2. 点击 "Settings" → "Domains"
3. 点击 "Add Custom Domain"
4. 输入域名（如 `api.yourdomain.com`）
5. 添加 CNAME 记录到你的 DNS：
   ```
   api.yourdomain.com → your-app.up.railway.app
   ```

### 更新前端配置

如果配置了自定义后端域名，需要更新前端环境变量：

1. 在 Cloudflare Pages 项目设置中
2. 进入 "Settings" → "Environment variables"
3. 修改 `VITE_API_URL` 为新域名
4. 重新部署（或等待自动部署）

---

## 故障排除

### 问题 1：前端无法连接后端

**症状**：登录失败，显示网络错误

**解决方案**：
1. 检查 `frontend/.env.production` 中的 `VITE_API_URL` 是否正确
2. 检查后端是否正常运行（访问后端 URL）
3. 检查浏览器控制台的 CORS 错误
4. 确认后端 CORS 配置包含前端域名

### 问题 2：Railway 部署失败

**症状**：部署过程中出错

**解决方案**：
1. 检查 `backend/package.json` 是否正确
2. 确认 Node.js 版本兼容（Railway 默认使用最新 LTS）
3. 查看 Railway 部署日志
4. 尝试本地运行 `cd backend && npm install && node app.js`

### 问题 3：Cloudflare Pages 构建失败

**症状**：构建过程中出错

**解决方案**：
1. 检查构建命令是否正确
2. 确认 `frontend/dist` 目录路径
3. 查看构建日志
4. 尝试本地构建 `cd frontend && npm run build`

### 问题 4：Git 推送失败

**症状**：`git push` 时认证失败

**解决方案**：
1. 确认使用后端 URL（不是前端 URL）
2. 检查用户名和密码是否正确
3. 清除 Git 凭据缓存：
   ```bash
   git credential-cache exit
   ```

---

## 成本估算

### 免费额度

- **Cloudflare Pages**: 
  - ✅ 无限请求
  - ✅ 500 次构建/月
  - ✅ 全球 CDN

- **Railway**:
  - ✅ $5 免费额度/月
  - ✅ 约 500 小时运行时间
  - ✅ 适合小型项目

- **Render**:
  - ✅ 免费层（有限制）
  - ⚠️ 15 分钟无活动后休眠
  - ⚠️ 每月 750 小时

### 付费方案

- **Railway**: $5/月起，按使用量计费
- **Render**: $7/月起，无休眠
- **VPS**: $5-20/月（Vultr, DigitalOcean）

---

## 下一步优化

### 1. 配置 CI/CD

在 GitHub 仓库中添加 `.github/workflows/deploy.yml`：

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd frontend && npm install && npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: pages deploy frontend/dist --project-name=git-server-frontend
```

### 2. 添加监控

- Railway 自带监控面板
- 配置 Cloudflare Analytics
- 使用 Sentry 监控错误

### 3. 性能优化

- 启用 Cloudflare CDN 缓存
- 压缩静态资源
- 使用 HTTP/2

### 4. 安全加固

- 修改默认管理员密码
- 配置 HTTPS（自动）
- 启用 Cloudflare WAF
- 限制 API 访问频率

---

## 快速命令参考

```bash
# 部署前端到 Cloudflare
cd frontend && npm run build && wrangler pages deploy dist

# 部署后端到 Railway
cd backend && railway up

# 查看 Railway 日志
railway logs

# 查看 Railway 状态
railway status

# 打开 Railway Dashboard
railway open

# 本地测试
cd backend && npm start
cd frontend && npm run dev
```

---

## 需要帮助？

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Railway 文档](https://docs.railway.app/)
- [Render 文档](https://render.com/docs)
- [Vite 环境变量](https://vitejs.dev/guide/env-and-mode.html)

---

**祝你部署顺利！** 🎉
