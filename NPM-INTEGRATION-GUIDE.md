# NPM 私服集成指南

## 🚀 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

新增的依赖：
- `verdaccio`: NPM 私服
- `http-proxy-middleware`: HTTP 代理中间件

### 2. 启动服务

#### 方式一：使用启动脚本（推荐）
```bash
# Windows
start-with-npm.bat
```

#### 方式二：手动启动
```bash
# 1. 启动 Verdaccio
cd backend
npm run verdaccio:start

# 2. 启动 Git 服务器（新终端）
npm start
```

### 3. 访问系统

- **Git 服务器**: http://localhost:3000
- **默认账号**: admin / 123456

## 🎯 功能特性

### 界面切换
- **私有仓库**: 管理 Git 仓库（原有功能）
- **私有NPM**: 管理 NPM 包（新功能）

### NPM 包管理
- ✅ 查看包列表
- ✅ 查看包详情
- ✅ 删除包
- ✅ 服务状态检查
- ✅ 搜索过滤

### 视觉区分
- **Git 模式**: 蓝色主题
- **NPM 模式**: 绿色主题

## 📦 使用 NPM 私服

### 发布包到私服

```bash
# 1. 配置 NPM 源
npm config set registry http://localhost:3000/api/npm

# 2. 登录（如果需要）
npm login --registry http://localhost:3000/api/npm

# 3. 发布包
npm publish
```

### 安装私服包

```bash
# 1. 配置源
npm config set registry http://localhost:3000/api/npm

# 2. 安装包
npm install your-package-name
```

### 恢复默认源

```bash
npm config set registry https://registry.npmjs.org/
```

## 🔧 配置说明

### Verdaccio 配置文件

位置: `backend/verdaccio-config.yaml`

```yaml
# 存储路径
storage: ./verdaccio-storage

# 禁用 Web 界面（使用我们的界面）
web:
  enable: false

# 监听地址（仅本地）
listen: 127.0.0.1:4873

# 包访问控制
packages:
  '@*/*':
    access: $authenticated
    publish: $authenticated
    proxy: npmjs
  '**':
    access: $all
    publish: $authenticated
    proxy: npmjs
```

### 权限说明

- **查看包**: 所有登录用户
- **发布包**: 管理员和超管
- **删除包**: 管理员和超管

## 🛠️ 开发说明

### 后端 API

```javascript
// NPM 包管理 API
GET    /api/npm/packages        // 获取包列表
GET    /api/npm/package/:name   // 获取包详情
DELETE /api/npm/package/:name   // 删除包
GET    /api/npm/status          // 服务状态

// NPM 协议代理
*      /api/npm/*               // 代理到 Verdaccio
```

### 前端组件

- `RepoManagement.vue`: 主管理界面
- 支持模式切换（Git/NPM）
- 响应式设计
- 主题切换

## 🔍 故障排除

### 1. Verdaccio 启动失败

```bash
# 检查端口占用
netstat -ano | findstr :4873

# 手动启动
cd backend
npx verdaccio --config ./verdaccio-config.yaml
```

### 2. NPM 包列表为空

- 确认 Verdaccio 服务正在运行
- 检查 `backend/verdaccio-storage` 目录
- 查看浏览器控制台错误

### 3. 发布失败

```bash
# 检查认证
npm whoami --registry http://localhost:3000/api/npm

# 检查权限
# 确保用户是管理员或超管
```

### 4. 代理错误

- 检查 Verdaccio 是否在 127.0.0.1:4873 运行
- 查看后端日志
- 确认防火墙设置

## 📁 文件结构

```
backend/
├── verdaccio-config.yaml      # Verdaccio 配置
├── verdaccio-storage/         # NPM 包存储（自动创建）
├── routes/npm-proxy.js        # NPM 代理路由
└── package.json               # 新增 Verdaccio 依赖

frontend/
└── src/views/RepoManagement.vue  # 更新的管理界面
```

## 🚀 下一步计划

### 阶段二功能
- [ ] 组件库类型仓库标识
- [ ] 自动发布流程
- [ ] 版本管理增强
- [ ] 使用统计

### 阶段三功能
- [ ] 组件文档生成
- [ ] 依赖关系图
- [ ] 下载统计
- [ ] 搜索优化

## 💡 最佳实践

1. **包命名**: 使用 scoped 包名 `@yourcompany/package-name`
2. **版本管理**: 遵循语义化版本 `major.minor.patch`
3. **文档**: 在包中包含完整的 README.md
4. **测试**: 发布前充分测试
5. **备份**: 定期备份 `verdaccio-storage` 目录

## 🔒 安全建议

1. **网络**: 仅在内网使用，或配置 HTTPS
2. **认证**: 定期更换管理员密码
3. **权限**: 严格控制发布权限
4. **备份**: 定期备份包数据
5. **监控**: 监控异常访问

---

**开发者**: tinyflake  
**版本**: 2.2.0  
**更新时间**: 2026-01-21
