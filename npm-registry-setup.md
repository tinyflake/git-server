# NPM 私服部署指南

## 使用 Verdaccio 搭建 NPM 私服

### 1. 安装 Verdaccio

```bash
# 全局安装
npm install -g verdaccio

# 或使用 Docker（推荐生产环境）
docker run -it --rm --name verdaccio -p 4873:4873 verdaccio/verdaccio
```

### 2. 启动服务

```bash
# 直接启动（开发环境）
verdaccio

# 后台运行（生产环境）
nohup verdaccio &
```

默认访问地址：http://localhost:4873

### 3. 配置文件

Verdaccio 配置文件位置：`~/.config/verdaccio/config.yaml`

```yaml
# 存储路径
storage: ./storage
# 插件路径
plugins: ./plugins

# Web 界面配置
web:
  title: 我的组件库私服
  # 禁用注册（可选）
  # enable: false

# 认证配置
auth:
  htpasswd:
    file: ./htpasswd
    # 最大用户数，-1 表示无限制
    max_users: -1

# 上游代理（代理公共 NPM）
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
    timeout: 30s

# 包访问控制
packages:
  # 私有包（以 @yourcompany 开头）
  '@yourcompany/*':
    access: $authenticated
    publish: $authenticated
    unpublish: $authenticated
    proxy: npmjs

  # 公共包代理
  '**':
    access: $all
    publish: $authenticated
    unpublish: $authenticated
    proxy: npmjs

# 服务器配置
listen: 0.0.0.0:4873

# 日志配置
logs:
  - { type: stdout, format: pretty, level: http }
```

### 4. 用户管理

```bash
# 添加用户
npm adduser --registry http://localhost:4873

# 登录
npm login --registry http://localhost:4873

# 查看当前用户
npm whoami --registry http://localhost:4873
```

### 5. 发布组件

```bash
# 设置发布源
npm config set registry http://localhost:4873

# 或在 package.json 中指定
{
  "publishConfig": {
    "registry": "http://localhost:4873"
  }
}

# 发布
npm publish
```

### 6. 使用组件

```bash
# 安装私有组件
npm install @yourcompany/my-component --registry http://localhost:4873

# 或配置 .npmrc
echo "registry=http://localhost:4873" > .npmrc
npm install @yourcompany/my-component
```

## Docker 部署（推荐生产环境）

### docker-compose.yml

```yaml
version: '3.8'

services:
  verdaccio:
    image: verdaccio/verdaccio:latest
    container_name: verdaccio
    ports:
      - "4873:4873"
    volumes:
      - verdaccio-storage:/verdaccio/storage
      - verdaccio-plugins:/verdaccio/plugins
      - ./config.yaml:/verdaccio/conf/config.yaml
    environment:
      - VERDACCIO_USER_UID=1000
      - VERDACCIO_USER_GID=1000
    restart: unless-stopped

volumes:
  verdaccio-storage:
  verdaccio-plugins:
```

### 启动

```bash
docker-compose up -d
```

## 与你的 Git 服务器集成

### 1. 在你的项目中添加 NPM 私服管理

```javascript
// backend/routes/npm-registry-routes.js
const express = require('express')
const router = express.Router()
const { spawn } = require('child_process')

// 获取私服状态
router.get('/registry/status', (req, res) => {
  // 检查 Verdaccio 是否运行
  // 返回状态信息
})

// 发布组件到私服
router.post('/registry/publish', authenticateJWT, requireAdmin, (req, res) => {
  const { repoPath, registry } = req.body
  
  // 1. 构建组件
  // 2. 发布到私服
  // 3. 返回结果
})

module.exports = router
```

### 2. 前端界面集成

在你的仓库管理界面中添加：
- 私服状态显示
- 组件发布按钮
- 版本管理界面

## 高级配置

### 1. HTTPS 配置

```yaml
# config.yaml
https:
  key: path/to/server.key
  cert: path/to/server.crt
```

### 2. 存储后端

```yaml
# 使用 AWS S3
store:
  aws-s3-storage:
    bucket: my-verdaccio-bucket
    keyPrefix: verdaccio/
    region: us-east-1
```

### 3. 插件扩展

```bash
# 安装插件
npm install verdaccio-plugin-name

# 在配置中启用
plugins:
  - verdaccio-plugin-name
```

## 安全建议

1. **网络安全**
   - 使用防火墙限制访问
   - 配置 HTTPS
   - 使用反向代理（Nginx）

2. **认证安全**
   - 定期更换密码
   - 限制用户数量
   - 使用强密码策略

3. **备份策略**
   - 定期备份存储目录
   - 备份配置文件
   - 监控磁盘空间

## 监控和维护

### 1. 日志监控

```bash
# 查看日志
tail -f ~/.config/verdaccio/verdaccio.log

# 或使用 PM2 管理
pm2 start verdaccio
pm2 logs verdaccio
```

### 2. 存储清理

```bash
# 清理旧版本
verdaccio --clear-cache

# 手动清理存储
rm -rf ~/.local/share/verdaccio/storage/package-name
```

## 总结

使用 Verdaccio 搭建 NPM 私服的优势：

✅ **简单易用** - 5分钟即可部署  
✅ **功能完整** - 支持所有 NPM 功能  
✅ **高度可配置** - 灵活的权限和代理设置  
✅ **轻量级** - 资源占用少  
✅ **社区活跃** - 文档完善，问题解决快  

这样你就有了完整的组件库生态：
- Git 服务器管理源码
- NPM 私服管理发布包
- 统一的用户权限体系
