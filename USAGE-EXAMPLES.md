# Git Server 使用示例

## 📦 安装方式

### 1. 全局安装

```bash
npm install -g git-server
```

安装后可以直接使用 `git-server` 命令：

```bash
git-server
git-server --port 8080
git-server help
```

### 2. 项目安装

```bash
npm install git-server
```

使用 npx 运行：

```bash
npx git-server
npx git-server --port 8080
```

### 3. 无需安装直接运行

```bash
npx git-server
```

## 🚀 命令行使用

### 启动服务器

```bash
# 默认配置启动（端口 3000）
git-server

# 指定端口
git-server --port 8080

# 指定主机和端口
git-server --host 0.0.0.0 --port 8080

# 指定仓库路径
git-server --repo /path/to/repos
```

### 初始化配置

```bash
# 在当前目录创建 config.json
git-server init
```

### 查看帮助

```bash
git-server help
```

### 查看版本

```bash
git-server version
```

## 💻 编程式使用

### 基础用法

```javascript
const GitServer = require('git-server');

// 创建服务器实例
const server = new GitServer({
  port: 3000,
  host: 'localhost',
  repoPath: './repos'
});

// 启动服务器
server.start()
  .then(() => {
    console.log('服务器启动成功！');
  })
  .catch(error => {
    console.error('启动失败:', error);
  });
```

### 使用 async/await

```javascript
const GitServer = require('git-server');

async function main() {
  const server = new GitServer({
    port: 3000,
    host: 'localhost',
    repoPath: './repos'
  });

  try {
    await server.start();
    console.log('服务器运行中...');
  } catch (error) {
    console.error('启动失败:', error);
  }
}

main();
```

### 便捷启动函数

```javascript
const { start } = require('git-server');

// 使用默认配置启动
start();

// 使用自定义配置启动
start({
  port: 8080,
  host: '0.0.0.0',
  repoPath: '/var/repos'
});
```

### 停止服务器

```javascript
const GitServer = require('git-server');

const server = new GitServer();

// 启动
await server.start();

// 稍后停止
await server.stop();
```

### 在 Express 应用中集成

```javascript
const express = require('express');
const GitServer = require('git-server');

const app = express();

// 你的其他路由
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello' });
});

// 集成 Git Server
const gitServer = new GitServer({
  port: 3000,
  repoPath: './repos'
});

gitServer.start();
```

## 🔧 配置选项

```javascript
const server = new GitServer({
  // 服务器端口
  port: 3000,
  
  // 服务器主机
  host: 'localhost',
  
  // Git 仓库存储路径
  repoPath: './repos',
  
  // 配置文件路径
  configPath: './config.json'
});
```

## 📝 实际应用场景

### 场景 1: 开发环境快速启动

```bash
# 在项目目录下
npx git-server
```

### 场景 2: 生产环境部署

```javascript
// server.js
const GitServer = require('git-server');

const server = new GitServer({
  port: process.env.PORT || 3000,
  host: '0.0.0.0',
  repoPath: process.env.REPO_PATH || '/var/repos'
});

server.start();

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到 SIGTERM 信号，正在关闭...');
  await server.stop();
  process.exit(0);
});
```

### 场景 3: Docker 容器中运行

```dockerfile
FROM node:16

WORKDIR /app

# 安装 git-server
RUN npm install -g git-server

# 创建仓库目录
RUN mkdir -p /repos

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["git-server", "--host", "0.0.0.0", "--repo", "/repos"]
```

### 场景 4: PM2 进程管理

```json
{
  "apps": [{
    "name": "git-server",
    "script": "git-server",
    "args": "--port 3000 --host 0.0.0.0",
    "instances": 1,
    "autorestart": true,
    "watch": false,
    "max_memory_restart": "1G",
    "env": {
      "NODE_ENV": "production"
    }
  }]
}
```

启动：

```bash
pm2 start ecosystem.config.js
```

### 场景 5: 自定义启动脚本

```javascript
// start-git-server.js
const GitServer = require('git-server');
const path = require('path');

const server = new GitServer({
  port: 3000,
  host: '0.0.0.0',
  repoPath: path.join(__dirname, 'repos')
});

console.log('🚀 正在启动 Git Server...');

server.start()
  .then(() => {
    console.log('✅ Git Server 启动成功！');
    console.log(`📍 访问地址: http://localhost:3000`);
    console.log(`👤 默认账号: admin / 123456`);
  })
  .catch(error => {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  });

// 处理退出信号
process.on('SIGINT', async () => {
  console.log('\n⏹️  正在停止服务器...');
  await server.stop();
  process.exit(0);
});
```

运行：

```bash
node start-git-server.js
```

## 🌐 Git 操作示例

### 克隆仓库

```bash
git clone http://localhost:3000/git/my-repo
```

### 推送代码

```bash
cd my-repo
git add .
git commit -m "Update"
git push origin main
```

推送时会提示输入用户名和密码（使用系统中配置的用户）。

### 拉取代码

```bash
git pull origin main
```

## 🔐 默认账号

- 用户名: `admin`
- 密码: `123456`
- 角色: 超级管理员

首次登录后建议立即修改密码！

## 📚 更多信息

- [完整文档](https://github.com/tinyflake/git-server)
- [API 文档](https://github.com/tinyflake/git-server/blob/main/README.md)
- [问题反馈](https://github.com/tinyflake/git-server/issues)
