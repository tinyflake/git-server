# Build Release 更新说明

## 更新内容

### 1. 启动脚本（Windows + Linux）

#### Windows 脚本（.bat）
- `start.bat` - 一键启动所有服务
- `start-verdaccio.bat` - 单独启动 Verdaccio
- `start-main.bat` - 单独启动主服务

#### Linux 脚本（.sh）
- `start.sh` - 一键启动所有服务（后台运行）
- `start-verdaccio.sh` - 单独启动 Verdaccio
- `start-main.sh` - 单独启动主服务

所有 .sh 文件自动设置为可执行权限（755）。

### 2. Docker Compose 配置

**文件：`docker-compose.yml`**

```yaml
version: '3.8'

services:
  git-service:
    image: node:18-alpine
    volumes:
      - ./:/app
    working_dir: /app
    command: sh start.sh
    network_mode: "host"
    restart: always
```

特点：
- 使用 node:18-alpine 镜像
- 挂载整个项目目录
- 使用 host 网络模式（直接使用宿主机端口）
- 自动重启
- 执行 start.sh 启动所有服务

### 3. Nginx 反向代理配置

**文件：`nginx.conf`**

配置内容：
- HTTP 自动跳转 HTTPS
- 代理前端页面（5173 端口）
- 代理后端 API（9001 端口）
- 代理 Verdaccio（4873 端口）
- SSL 证书配置（宝塔面板路径）

域名：`git.tinyflake.top`

访问路径：
- `/` → 前端页面
- `/api/` → 后端接口
- `/verdaccio/` → NPM 私有源

## 构建后的目录结构

```
release/
├── backend/
│   ├── app.js
│   ├── routes/
│   ├── utils/
│   ├── config/
│   ├── dist/
│   ├── repos/
│   ├── verdaccio-storage/
│   ├── verdaccio-config.yaml
│   ├── logs/
│   ├── temp/
│   ├── backup/
│   └── package.json
├── config.json
├── start.bat                   ← Windows 一键启动
├── start-verdaccio.bat         ← Windows Verdaccio
├── start-main.bat              ← Windows 主服务
├── start.sh                    ← Linux 一键启动
├── start-verdaccio.sh          ← Linux Verdaccio
├── start-main.sh               ← Linux 主服务
├── docker-compose.yml          ← Docker 配置
├── nginx.conf                  ← Nginx 配置
├── ecosystem.config.js         ← PM2 配置
├── DEPLOYMENT-SERVER.md        ← 部署指南
└── README.md                   ← 使用说明
```

## 部署方式

### Windows 服务器
```bash
cd release
start.bat
```

### Linux 服务器

#### 方式 1：直接运行
```bash
cd release
./start.sh
```

#### 方式 2：PM2（推荐）
```bash
cd release
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 方式 3：Docker Compose
```bash
cd release
docker-compose up -d
```

## 注意事项

1. **端口要求**：
   - 9001：主服务
   - 4873：Verdaccio
   - 5173：前端（如果使用 Nginx 代理）

2. **Linux 脚本权限**：
   - 构建时自动设置为 755
   - 如果无法执行，手动设置：`chmod +x *.sh`

3. **Verdaccio 必须启动**：
   - NPM 功能依赖 Verdaccio
   - 使用一键启动脚本会自动启动两个服务

4. **Docker 网络模式**：
   - 使用 host 模式，直接使用宿主机端口
   - 无需端口映射

5. **Nginx 证书**：
   - 需要先申请 SSL 证书
   - 修改 nginx.conf 中的证书路径

## 构建命令

```bash
# Windows
build-release.bat

# 或直接运行
node build-release.js
```

构建完成后会显示：
- Windows 脚本列表
- Linux 脚本列表
- 部署配置文件列表
- 下一步操作说明

## 更新日志

- ✅ 添加 Linux 启动脚本（.sh）
- ✅ 保留 Windows 启动脚本（.bat）
- ✅ 添加 docker-compose.yml
- ✅ 添加 nginx.conf
- ✅ 更新 README 文档
- ✅ 更新构建输出信息
