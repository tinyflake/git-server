# 🚀 开始发布到 NPM

## 📋 准备工作（必须完成）

### 1. 更新仓库地址

打开 `package.json`，找到这几行：

```json
"repository": {
  "type": "git",
  "url": "https://github.com/tinyflake/git-server.git"
},
"bugs": {
  "url": "https://github.com/tinyflake/git-server/issues"
},
"homepage": "https://github.com/tinyflake/git-server#readme",
```

将 `tinyflake` 改为你的 GitHub 用户名。

### 2. 检查包名

访问 https://www.npmjs.com/package/git-server 查看包名是否已被占用。

**如果已被占用**，修改 `package.json` 中的 `name` 字段：

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

## 🚀 开始发布

### 方式 1: 一键发布（推荐）

双击运行：

```
publish-to-npm.bat
```

脚本会自动完成所有步骤。

### 方式 2: 手动发布

#### 步骤 1: 登录 npm

```bash
npm login
```

输入你的 npm 账号信息。

#### 步骤 2: 运行检查

```bash
node scripts/pre-publish-check.js
```

确保所有检查通过。

#### 步骤 3: 发布

```bash
npm publish --access public
```

## ✅ 验证发布

### 1. 查看包信息

```bash
npm info git-server
```

### 2. 测试安装

```bash
# 在新目录测试
mkdir test
cd test
npm install git-server
npx git-server
```

## 🎉 完成！

发布成功后，用户可以通过以下方式使用你的项目：

```bash
# 全局安装
npm install -g git-server
git-server

# 或直接运行
npx git-server
```

## 📚 更多信息

- [完整发布流程](./PUBLISH-WORKFLOW.md)
- [使用示例](./USAGE-EXAMPLES.md)
- [配置总结](./NPM-SETUP-SUMMARY.md)

## ❓ 遇到问题？

查看 [NPM 发布指南](./NPM-PUBLISH-GUIDE.md) 中的常见问题部分。

---

**祝发布顺利！** 🎊
