# 部署配置说明

## 项目配置

项目已完成配置化改造，支持灵活的部署方式。

### 配置文件

根目录的 `config.json` 包含所有配置：

```json
{
  "server": {
    "host": "localhost",
    "port": 9001,
    "timeout": 300000,
    "maxGitUploadSize": "1024mb"
  },
  "frontend": {
    "host": "localhost",
    "port": 3000
  },
  "git": {
    "defaultRepoPath": "./repos"
  },
  "deployment": {
    "mode": "development"
  }
}
```

### 配置优先级

1. 环境变量（最高优先级）
2. config.json 配置文件
3. 默认配置（最低优先级）

## 部署方式

### 1. 开发环境

```bash
# 启动后端
start-backend.bat

# 启动前端（新窗口）
start-frontend.bat
```

访问：
- 前端：http://localhost:3000
- 后端：http://localhost:9001

### 2. 生产环境 - 前后端分离

**后端部署：**
```bash
cd backend
npm install
node app.js
```

**前端部署：**
```bash
cd frontend
npm install
npm run build
# 将 dist 目录部署到 nginx 或其他静态服务器
```

### 3. 生产环境 - 前后端合并

```bash
# 构建前端
cd frontend
npm install
npm run build
cd ..

# 复制前端到后端
xcopy /s /e frontend\dist backend\dist\

# 启动后端（自动托管前端）
cd backend
npm install
node app.js
```

访问：http://localhost:9001

## 配置说明

### 服务器配置

```json
{
  "server": {
    "host": "0.0.0.0",    // 监听所有网络接口
    "port": 9001,         // 服务端口
    "timeout": 300000,    // 请求超时时间（毫秒）
    "maxGitUploadSize": "1024mb"  // 最大上传文件大小（支持 kb, mb, gb）
  }
}
```

### Git配置

```json
{
  "git": {
    "defaultRepoPath": "./repos"  // Git仓库存储路径
  }
}
```

## 常见问题

1. **端口被占用**
   - 修改 config.json 中的端口号
   - 或关闭占用端口的其他程序

2. **无法访问**
   - 检查防火墙设置
   - 确保端口已开放

3. **仓库路径问题**
   - 确保配置的路径存在且有写入权限
   - 相对路径是相对于backend目录

## 优势

- ✅ 无硬编码地址，支持任意IP和端口
- ✅ 支持环境变量覆盖配置
- ✅ 开发和生产环境灵活切换
- ✅ 前后端可分离或合并部署
- ✅ 统一的配置管理系统
