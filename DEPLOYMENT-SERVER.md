# 服务器部署指南

## 前提条件

确保服务器已安装：
- Node.js v16+ 
- Git
- npm 或 yarn

## 部署步骤

### 1. 上传发布包

将 `release` 目录上传到服务器，例如：

```bash
# 使用 scp
scp -r release/ user@server:/path/to/app/

# 或使用 FTP/SFTP 工具上传
```

### 2. 安装依赖

```bash
cd /path/to/app/release/backend
npm install
```

### 3. 配置服务器

编辑 `config.json`，修改为服务器的实际配置：

```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 9001
  },
  "git": {
    "defaultRepoPath": "./repos"
  }
}
```

**注意**：
- `host` 设置为 `0.0.0.0` 允许外部访问
- 确保端口 9001 和 4873 在防火墙中开放

### 4. 启动服务

#### 方式一：使用 start.bat（Windows 服务器）

```bash
cd /path/to/app/release
start.bat
```

这会启动两个窗口：
- Verdaccio NPM Server（端口 4873）
- Git Server（端口 9001）

#### 方式二：Linux 服务器使用 PM2（推荐）

安装 PM2：

```bash
npm install -g pm2
```

创建 PM2 配置文件 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [
    {
      name: 'verdaccio',
      script: 'npx',
      args: 'verdaccio --config verdaccio-config.yaml',
      cwd: '/path/to/app/release/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'git-server',
      script: 'app.js',
      cwd: '/path/to/app/release/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
```

启动服务：

```bash
cd /path/to/app/release
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # 设置开机自启
```

管理服务：

```bash
pm2 status          # 查看状态
pm2 logs            # 查看日志
pm2 restart all     # 重启所有服务
pm2 stop all        # 停止所有服务
pm2 delete all      # 删除所有服务
```

#### 方式三：使用 systemd（Linux）

创建 Verdaccio 服务文件 `/etc/systemd/system/verdaccio.service`：

```ini
[Unit]
Description=Verdaccio NPM Registry
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/app/release/backend
ExecStart=/usr/bin/npx verdaccio --config verdaccio-config.yaml
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

创建 Git Server 服务文件 `/etc/systemd/system/git-server.service`：

```ini
[Unit]
Description=Git Server
After=network.target verdaccio.service
Requires=verdaccio.service

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/app/release/backend
ExecStart=/usr/bin/node app.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable verdaccio
sudo systemctl enable git-server
sudo systemctl start verdaccio
sudo systemctl start git-server
```

管理服务：

```bash
sudo systemctl status verdaccio
sudo systemctl status git-server
sudo systemctl restart verdaccio
sudo systemctl restart git-server
sudo journalctl -u verdaccio -f  # 查看日志
sudo journalctl -u git-server -f
```

### 5. 验证部署

#### 检查服务状态

```bash
# 检查端口是否监听
netstat -tlnp | grep 9001
netstat -tlnp | grep 4873

# 或使用 ss
ss -tlnp | grep 9001
ss -tlnp | grep 4873
```

#### 访问测试

```bash
# 测试主服务
curl http://localhost:9001/api

# 测试 Verdaccio
curl http://localhost:4873
```

#### 浏览器访问

- Web 界面：http://your-server-ip:9001
- Verdaccio UI：http://your-server-ip:4873

### 6. 配置防火墙

#### Ubuntu/Debian (ufw)

```bash
sudo ufw allow 9001/tcp
sudo ufw allow 4873/tcp
sudo ufw reload
```

#### CentOS/RHEL (firewalld)

```bash
sudo firewall-cmd --permanent --add-port=9001/tcp
sudo firewall-cmd --permanent --add-port=4873/tcp
sudo firewall-cmd --reload
```

#### 云服务器安全组

如果使用云服务器（阿里云、腾讯云、AWS 等），需要在安全组中开放：
- 端口 9001（Git Server）
- 端口 4873（Verdaccio）

### 7. 配置反向代理（可选）

#### Nginx 配置示例

```nginx
# Git Server
server {
    listen 80;
    server_name git.yourdomain.com;

    location / {
        proxy_pass http://localhost:9001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Git HTTP 需要的特殊配置
        client_max_body_size 100M;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}

# NPM Registry
server {
    listen 80;
    server_name npm.yourdomain.com;

    location / {
        proxy_pass http://localhost:4873;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        client_max_body_size 50M;
    }
}
```

重启 Nginx：

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 故障排除

### Verdaccio 未启动

**症状**：前端显示"NPM 服务未运行"

**解决方法**：

1. 检查 Verdaccio 进程：
```bash
ps aux | grep verdaccio
```

2. 手动启动 Verdaccio：
```bash
cd /path/to/app/release/backend
npx verdaccio --config verdaccio-config.yaml
```

3. 检查端口占用：
```bash
netstat -tlnp | grep 4873
```

4. 查看日志：
```bash
# PM2
pm2 logs verdaccio

# systemd
sudo journalctl -u verdaccio -f
```

### 端口被占用

**症状**：启动失败，提示端口已被使用

**解决方法**：

1. 查找占用端口的进程：
```bash
lsof -i :9001
lsof -i :4873
```

2. 终止进程或修改配置文件中的端口

### 无法外部访问

**症状**：本地可以访问，外部无法访问

**解决方法**：

1. 检查 `config.json` 中 host 是否为 `0.0.0.0`
2. 检查防火墙规则
3. 检查云服务器安全组配置
4. 检查 SELinux 状态（CentOS/RHEL）：
```bash
sudo setenforce 0  # 临时关闭
```

### NPM 包发布失败

**症状**：npm publish 报错

**解决方法**：

1. 确保 Verdaccio 正在运行
2. 检查用户权限（在 Web 界面的权限管理中）
3. 检查 NPM registry 配置：
```bash
npm config get registry
```

4. 重新登录：
```bash
npm logout
npm login
```

### 数据迁移失败

**症状**：导入/导出数据时失败

**解决方法**：

1. 检查磁盘空间：
```bash
df -h
```

2. 检查目录权限：
```bash
ls -la /path/to/app/release/backend/temp
ls -la /path/to/app/release/backend/backup
```

3. 查看日志文件：
```bash
tail -f /path/to/app/release/backend/logs/*.log
```

## 维护建议

### 定期备份

使用数据迁移功能定期导出数据：

1. 登录 Web 界面（超级管理员账号）
2. 点击用户菜单 → "数据迁移"
3. 点击"导出所有数据"
4. 下载并保存备份文件

或使用脚本自动备份：

```bash
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 备份配置和数据
tar -czf "$BACKUP_DIR/git-server-backup-$DATE.tar.gz" \
  /path/to/app/release/backend/config \
  /path/to/app/release/backend/repos \
  /path/to/app/release/backend/verdaccio-storage

# 保留最近 7 天的备份
find "$BACKUP_DIR" -name "git-server-backup-*.tar.gz" -mtime +7 -delete
```

### 日志管理

定期清理日志文件：

```bash
# 清理 30 天前的日志
find /path/to/app/release/backend/logs -name "*.log" -mtime +30 -delete
```

### 更新升级

1. 备份当前数据
2. 上传新版本的 release 包
3. 停止服务
4. 替换文件（保留 config、repos、verdaccio-storage 目录）
5. 安装依赖：`npm install`
6. 启动服务
7. 验证功能

## 安全建议

1. **修改默认密码**：首次登录后立即修改 admin 账号密码
2. **使用 HTTPS**：配置 Nginx 反向代理并启用 SSL
3. **限制访问**：使用防火墙规则限制访问来源
4. **定期更新**：及时更新 Node.js 和依赖包
5. **监控日志**：定期检查日志文件，发现异常及时处理

## 性能优化

1. **使用 PM2 集群模式**（如果需要）：
```javascript
{
  name: 'git-server',
  script: 'app.js',
  instances: 'max',  // 使用所有 CPU 核心
  exec_mode: 'cluster'
}
```

2. **配置 Nginx 缓存**：缓存静态资源
3. **定期清理临时文件**：清理 temp 和 backup 目录
4. **监控资源使用**：使用 PM2 或其他监控工具

## 联系支持

如遇到问题，请查看：
- 项目文档：README.md
- NPM 集成指南：NPM-INTEGRATION-GUIDE.md
- 数据迁移指南：docs/DATA-MIGRATION-GUIDE.md
