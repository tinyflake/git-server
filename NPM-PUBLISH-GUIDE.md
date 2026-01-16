# NPM 发布指南

本指南说明如何将 git-server 发布到 npm。

## 📋 发布前准备

### 1. 确保代码已提交

```bash
git add .
git commit -m "准备发布到 npm"
git push
```

### 2. 更新 package.json 中的仓库地址

编辑 `package.json`，将以下字段更新为你的实际仓库地址：

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/你的用户名/git-server.git"
  },
  "bugs": {
    "url": "https://github.com/你的用户名/git-server/issues"
  },
  "homepage": "https://github.com/你的用户名/git-server#readme"
}
```

### 3. 登录 npm

```bash
npm login
```

输入你的 npm 账号信息：
- Username
- Password
- Email
- 2FA Code（如果启用了两步验证）

## 🚀 发布步骤

### 1. 检查发布内容

查看哪些文件会被发布：

```bash
npm pack --dry-run
```

### 2. 测试本地安装

```bash
# 打包
npm pack

# 在其他目录测试安装
cd /tmp
npm install /path/to/git-server-2.1.0.tgz

# 测试运行
npx git-server help
npx git-server
```

### 3. 发布到 npm

```bash
# 发布
npm publish

# 如果包名已被占用，可以使用作用域
npm publish --access public
```

### 4. 验证发布

```bash
# 查看包信息
npm info git-server

# 在新目录测试安装
mkdir test-install
cd test-install
npm install git-server
npx git-server
```

## 📦 使用方式

发布后，用户可以通过以下方式使用：

### 方式 1: 全局安装

```bash
npm install -g git-server
git-server
```

### 方式 2: 项目安装

```bash
npm install git-server
npx git-server
```

### 方式 3: 编程式使用

```javascript
const GitServer = require('git-server');

const server = new GitServer({
  port: 3000,
  host: 'localhost',
  repoPath: './repos'
});

server.start();
```

### 方式 4: 直接运行（无需安装）

```bash
npx git-server
```

## 🔄 更新版本

### 1. 更新版本号

```bash
# 补丁版本 (2.1.0 -> 2.1.1)
npm version patch

# 次版本 (2.1.0 -> 2.2.0)
npm version minor

# 主版本 (2.1.0 -> 3.0.0)
npm version major
```

### 2. 推送标签

```bash
git push --tags
git push
```

### 3. 重新发布

```bash
npm publish
```

## 📝 版本管理建议

- **补丁版本 (patch)**: 修复 bug，不影响 API
- **次版本 (minor)**: 新增功能，向后兼容
- **主版本 (major)**: 破坏性更改，不向后兼容

## 🔍 常见问题

### 包名已被占用

如果 `git-server` 已被占用，可以：

1. 使用作用域包名：
```json
{
  "name": "@你的用户名/git-server"
}
```

2. 使用其他名称：
```json
{
  "name": "my-git-server-manager"
}
```

### 发布失败

1. 检查是否已登录：
```bash
npm whoami
```

2. 检查网络连接

3. 检查 package.json 是否有语法错误

4. 检查是否有权限发布该包名

### 撤销发布

```bash
# 撤销特定版本（发布后 72 小时内）
npm unpublish git-server@2.1.0

# 撤销整个包（谨慎使用）
npm unpublish git-server --force
```

## 📊 发布后维护

### 查看下载统计

```bash
npm info git-server
```

或访问：https://www.npmjs.com/package/git-server

### 更新文档

确保 README.md 包含：
- 安装说明
- 使用示例
- API 文档
- 常见问题

### 处理 Issues

及时回复 GitHub Issues 和 npm 上的问题反馈。

## ✅ 发布检查清单

- [ ] 代码已测试通过
- [ ] 版本号已更新
- [ ] CHANGELOG.md 已更新
- [ ] README.md 已更新
- [ ] package.json 信息完整
- [ ] 仓库地址正确
- [ ] LICENSE 文件存在
- [ ] .npmignore 配置正确
- [ ] 本地测试安装成功
- [ ] 已登录 npm 账号
- [ ] 代码已推送到 Git

## 🎉 完成

发布成功后，你的包将在几分钟内出现在 npm 上，用户就可以通过 `npm install git-server` 安装使用了！
