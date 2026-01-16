# 🚀 快速发布到 NPM

## 一键发布（推荐）

```bash
# Windows
publish-to-npm.bat
```

## 手动发布（3 步）

### 1. 更新仓库地址

编辑 `package.json`：

```json
{
  "repository": {
    "url": "https://github.com/你的用户名/git-server.git"
  }
}
```

### 2. 登录 npm

```bash
npm login
```

### 3. 发布

```bash
npm publish --access public
```

## 完成！

用户现在可以使用：

```bash
npm install -g git-server
git-server
```

或

```bash
npx git-server
```

---

**详细文档**: 
- [完整发布流程](./PUBLISH-WORKFLOW.md)
- [NPM 发布指南](./NPM-PUBLISH-GUIDE.md)
- [使用示例](./USAGE-EXAMPLES.md)
