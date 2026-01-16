# 📦 NPM 发布完整流程

本文档说明如何将 git-server 发布到 npm 的完整流程。

## 🎯 发布前准备

### 1. 确保代码已准备好

- [ ] 所有功能已完成并测试
- [ ] 代码已提交到 Git
- [ ] 前端已构建（backend/dist 目录存在）
- [ ] 文档已更新

### 2. 更新仓库地址

编辑 `package.json`，将仓库地址改为你的实际地址：

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

### 3. 检查包名

如果 `git-server` 已被占用，需要修改包名：

```json
{
  "name": "@你的用户名/git-server"
}
```

或使用其他名称：

```json
{
  "name": "my-git-server-manager"
}
```

## 🚀 发布流程

### 方式 1: 使用自动化脚本（推荐）

```bash
# Windows
publish-to-npm.bat
```

脚本会自动：
1. 运行发布前检查
2. 显示将要发布的文件
3. 确认发布
4. 检查 npm 登录状态
5. 执行发布

### 方式 2: 手动发布

#### 步骤 1: 更新版本号

```bash
# 补丁版本 (2.1.0 -> 2.1.1)
npm run version:patch

# 次版本 (2.1.0 -> 2.2.0)
npm run version:minor

# 主版本 (2.1.0 -> 3.0.0)
npm run version:major
```

#### 步骤 2: 编辑 CHANGELOG.md

填写本次更新的内容。

#### 步骤 3: 提交更改

```bash
git add .
git commit -m "chore: bump version to 2.1.1"
git tag v2.1.1
git push && git push --tags
```

#### 步骤 4: 运行发布前检查

```bash
node scripts/pre-publish-check.js
```

#### 步骤 5: 查看将要发布的文件

```bash
npm run test-pack
```

#### 步骤 6: 登录 npm

```bash
npm login
```

输入你的 npm 账号信息。

#### 步骤 7: 发布

```bash
# 公开包
npm publish --access public

# 或者（如果包名没有作用域）
npm publish
```

## ✅ 发布后验证

### 1. 检查包信息

```bash
npm info git-server
```

### 2. 测试安装

```bash
# 在新目录测试
mkdir test-install
cd test-install
npm install git-server
npx git-server help
```

### 3. 测试运行

```bash
npx git-server
```

访问 http://localhost:3000 确认服务正常。

### 4. 查看 npm 页面

访问: https://www.npmjs.com/package/git-server

## 🔄 更新版本

当需要发布新版本时：

### 1. 修复 bug 或添加功能

完成代码修改和测试。

### 2. 更新版本号

```bash
# 根据更新类型选择
npm run version:patch  # bug 修复
npm run version:minor  # 新功能
npm run version:major  # 破坏性更改
```

### 3. 更新 CHANGELOG.md

填写更新内容。

### 4. 提交并发布

```bash
git add .
git commit -m "chore: bump version to x.x.x"
git tag vx.x.x
git push && git push --tags
npm publish
```

## 📋 版本号规范

遵循语义化版本（Semantic Versioning）：

- **主版本号 (Major)**: 不兼容的 API 修改
  - 例: 1.0.0 → 2.0.0
  - 使用: `npm run version:major`

- **次版本号 (Minor)**: 向后兼容的功能性新增
  - 例: 1.0.0 → 1.1.0
  - 使用: `npm run version:minor`

- **修订号 (Patch)**: 向后兼容的问题修正
  - 例: 1.0.0 → 1.0.1
  - 使用: `npm run version:patch`

## 🛠️ 常用命令

```bash
# 查看当前版本
npm version

# 查看 npm 登录状态
npm whoami

# 查看包信息
npm info git-server

# 查看将要发布的文件
npm run test-pack

# 运行发布前检查
node scripts/pre-publish-check.js

# 更新版本号
npm run version:patch
npm run version:minor
npm run version:major

# 发布
npm publish --access public

# 撤销发布（72小时内）
npm unpublish git-server@2.1.0
```

## ⚠️ 注意事项

### 发布前

- [ ] 确保前端已构建（backend/dist 存在）
- [ ] 确保所有测试通过
- [ ] 确保 README.md 已更新
- [ ] 确保 CHANGELOG.md 已更新
- [ ] 确保版本号已更新
- [ ] 确保代码已推送到 Git

### 发布时

- [ ] 使用正确的 npm 账号
- [ ] 检查包名是否可用
- [ ] 确认发布的文件列表正确
- [ ] 使用 `--access public` 发布公开包

### 发布后

- [ ] 验证包可以正常安装
- [ ] 验证包可以正常运行
- [ ] 更新 GitHub Release
- [ ] 通知用户新版本发布

## 🐛 常见问题

### 问题 1: 包名已被占用

**解决方案**: 使用作用域包名或更改包名

```json
{
  "name": "@你的用户名/git-server"
}
```

### 问题 2: 未登录 npm

**解决方案**: 运行 `npm login`

### 问题 3: 权限不足

**解决方案**: 确保使用正确的 npm 账号，或使用 `--access public`

### 问题 4: 版本号已存在

**解决方案**: 更新版本号后再发布

```bash
npm run version:patch
npm publish
```

### 问题 5: 发布的文件不正确

**解决方案**: 检查 `.npmignore` 和 `package.json` 的 `files` 字段

## 📚 相关文档

- [NPM 发布指南](./NPM-PUBLISH-GUIDE.md)
- [使用示例](./USAGE-EXAMPLES.md)
- [README](./README.md)
- [CHANGELOG](./CHANGELOG.md)

## 🎉 完成

按照以上流程，你的包就可以成功发布到 npm 了！

用户可以通过以下方式使用：

```bash
# 全局安装
npm install -g git-server
git-server

# 项目安装
npm install git-server
npx git-server

# 直接运行
npx git-server
```
