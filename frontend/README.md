# Git 仓库管理系统 - 前端

基于 Vue3 + Element Plus 的 Git 仓库管理前端界面。

## 功能特性

- 📋 展示所有仓库列表
- ➕ 创建新仓库
- 📝 修改仓库存储路径
- 🔄 实时刷新仓库信息

## 快速开始

### 安装依赖
```bash
cd frontend
npm install
# 或者
yarn install
```

### 启动开发服务器
```bash
npm run dev
# 或者
yarn dev
```

访问 http://localhost:3000

### 构建生产版本
```bash
npm run build
# 或者
yarn build
```

## 技术栈

- Vue 3 (Composition API)
- Element Plus UI 组件库
- Axios HTTP 客户端
- Vite 构建工具

## API 接口

前端通过代理访问后端 API：
- `GET /api/repo/list` - 获取仓库列表
- `POST /api/repo/create` - 创建新仓库
- `POST /api/repo/update-path` - 修改仓库路径
