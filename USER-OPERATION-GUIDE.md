# 用户端完整操作流程指南

## 📋 概述

本指南详细说明了在新电脑或空账户机器上如何正确使用Git仓库和NPM私有仓库的完整流程。

## 🔧 环境准备

### 1. 确认服务器信息
- **Git服务器地址**：`http://your-server:3000`
- **NPM私有仓库地址**：`http://your-server:3000/api/npm`
- **Web管理界面**：`http://your-server:3000`

### 2. 获取用户凭据
联系管理员获取：
- 用户名
- 密码
- 确认账户权限（Git访问权限、NPM权限等）

---

## 🔐 Git仓库操作流程

### Git Clone（克隆仓库）

#### ✅ 公开仓库克隆
对于设置为公开访问的仓库，可以直接克隆：

```bash
# 直接克隆，无需认证
git clone http://your-server:3000/git/repo-name.git
```

**结果**：
- ✅ 成功：直接下载仓库内容
- ❌ 失败：可能是仓库不存在或设置为私有

#### 🔒 私有仓库克隆
对于设置了访问白名单的私有仓库：

```bash
# 克隆时会提示输入用户名密码
git clone http://your-server:3000/git/repo-name.git

# 或者在URL中包含用户名（仍会提示输入密码）
git clone http://username@your-server:3000/git/repo-name.git
```

**认证流程**：
1. Git客户端发送克隆请求
2. 服务器检查仓库访问权限
3. 如果需要认证，返回401状态码
4. Git客户端提示输入用户名和密码
5. 服务器验证凭据和仓库访问权限
6. 验证成功后开始传输仓库数据

**可能的错误**：
- `Authentication failed`：用户名或密码错误
- `Repository not found`：仓库不存在或无访问权限
- `Access denied`：用户不在仓库白名单中

### Git Push（推送代码）

**所有推送操作都需要认证**：

```bash
# 首次推送
git push origin main

# 后续推送
git push
```

**认证流程**：
1. Git客户端发送推送请求
2. 服务器要求HTTP Basic认证
3. Git客户端提示输入用户名和密码
4. 服务器验证用户凭据
5. 检查用户是否有仓库访问权限
6. 验证成功后执行推送操作

### Git Pull/Fetch（拉取更新）

```bash
# 拉取最新代码
git pull origin main

# 或者分步操作
git fetch origin
git merge origin/main
```

**权限说明**：
- 公开仓库：无需认证
- 私有仓库：需要认证，流程同clone

---

## 📦 NPM私有仓库操作流程

### 1. 配置NPM源

**首次配置**：
```bash
# 设置私有仓库为默认源
npm config set registry http://your-server:3000/api/npm

# 或者仅为特定scope设置
npm config set @company:registry http://your-server:3000/api/npm
```

**验证配置**：
```bash
# 查看当前配置
npm config get registry

# 查看所有配置
npm config list
```

### 2. NPM登录认证

**必须先登录才能进行需要认证的操作**：

```bash
# 登录到私有仓库
npm login --registry http://your-server:3000/api/npm
```

**登录流程**：
1. 输入用户名（与Git相同）
2. 输入密码（与Git相同）
3. 输入邮箱（可选，按回车跳过）
4. 系统验证凭据和NPM登录权限
5. 登录成功后保存认证信息到 `~/.npmrc`

**可能的错误**：
- `401 Unauthorized`：用户名或密码错误
- `403 Forbidden`：用户没有NPM登录权限
- `您没有访问NPM仓库的权限，请联系管理员`：权限被禁用

### 3. 安装包（下载）

```bash
# 安装公开包
npm install package-name

# 安装私有包
npm install @company/package-name

# 安装特定版本
npm install package-name@1.0.0
```

**权限说明**：
- 所有有NPM登录权限的用户都可以下载包
- 无需额外权限配置

### 4. 发布包（上传）

**发布前检查**：
```bash
# 检查当前登录状态
npm whoami --registry http://your-server:3000/api/npm

# 检查包信息
npm pack --dry-run
```

**发布操作**：
```bash
# 发布到私有仓库
npm publish --registry http://your-server:3000/api/npm

# 或者如果已设置为默认源
npm publish
```

**发布流程**：
1. NPM客户端读取 `package.json`
2. 打包项目文件
3. 发送发布请求到私有仓库
4. 服务器验证用户认证状态
5. 检查用户是否有发布权限
6. 检查包名是否在用户允许列表中
7. 验证通过后保存包到仓库

**可能的错误**：
- `401 Unauthorized`：未登录或登录已过期
- `403 Forbidden`：没有发布权限
- `您没有发布包 "package-name" 的权限`：包名不在允许列表中

### 5. 其他NPM操作

```bash
# 查看包信息
npm view package-name

# 查看包版本列表
npm view package-name versions --json

# 搜索包
npm search keyword

# 登出
npm logout --registry http://your-server:3000/api/npm
```

---

## 🚨 常见问题和解决方案

### Git相关问题

#### 问题1：Clone时提示"Repository not found"
**可能原因**：
- 仓库名称错误
- 仓库设置为私有，需要认证
- 用户不在仓库白名单中

**解决方案**：
1. 确认仓库名称正确
2. 联系管理员确认仓库访问权限
3. 使用正确的用户凭据

#### 问题2：Push时提示"Authentication failed"
**可能原因**：
- 用户名或密码错误
- 账户被禁用

**解决方案**：
1. 确认用户名密码正确
2. 联系管理员检查账户状态
3. 尝试重新输入凭据

#### 问题3：Git操作很慢
**可能原因**：
- 网络连接问题
- 仓库文件过大

**解决方案**：
1. 检查网络连接
2. 使用 `--depth 1` 进行浅克隆
3. 联系管理员优化仓库

### NPM相关问题

#### 问题1：npm login失败
**可能原因**：
- 用户名或密码错误
- 没有NPM登录权限
- 网络连接问题

**解决方案**：
1. 确认凭据正确
2. 联系管理员检查NPM权限
3. 检查网络和服务器状态

#### 问题2：npm publish被拒绝
**可能原因**：
- 未登录或登录过期
- 没有发布权限
- 包名不在允许列表中

**解决方案**：
1. 重新执行 `npm login`
2. 联系管理员配置发布权限
3. 确认包名在允许列表中

#### 问题3：npm install失败
**可能原因**：
- 包不存在
- 网络问题
- 权限问题

**解决方案**：
1. 确认包名和版本正确
2. 检查网络连接
3. 确认已正确登录

---

## 📝 完整操作示例

### 场景1：新员工首次使用

```bash
# 1. 配置Git用户信息
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"

# 2. 克隆项目仓库
git clone http://git-server:3000/git/my-project.git
cd my-project

# 3. 配置NPM私有源
npm config set @company:registry http://git-server:3000/api/npm

# 4. 登录NPM
npm login --registry http://git-server:3000/api/npm
# 输入用户名、密码

# 5. 安装项目依赖
npm install

# 6. 开始开发...
```

### 场景2：发布新的NPM包

```bash
# 1. 创建新包目录
mkdir my-new-package
cd my-new-package

# 2. 初始化包
npm init -y

# 3. 编辑package.json，设置包名
# "name": "@company/my-new-package"

# 4. 编写代码...

# 5. 确认登录状态
npm whoami --registry http://git-server:3000/api/npm

# 6. 发布包
npm publish --registry http://git-server:3000/api/npm
```

### 场景3：团队协作开发

```bash
# 1. 克隆团队仓库
git clone http://git-server:3000/git/team-project.git
cd team-project

# 2. 创建开发分支
git checkout -b feature/new-feature

# 3. 安装依赖
npm install

# 4. 开发新功能...

# 5. 提交代码
git add .
git commit -m "Add new feature"

# 6. 推送到远程
git push origin feature/new-feature
# 输入用户名、密码

# 7. 创建Pull Request（通过Web界面）
```

---

## 🔧 高级配置

### Git凭据缓存

避免每次都输入密码：

```bash
# Windows
git config --global credential.helper manager-core

# macOS
git config --global credential.helper osxkeychain

# Linux
git config --global credential.helper cache
git config --global credential.helper 'cache --timeout=3600'
```

### NPM配置文件

创建项目级别的 `.npmrc` 文件：

```bash
# 在项目根目录创建 .npmrc
echo "@company:registry=http://git-server:3000/api/npm" > .npmrc
```

### 环境变量配置

```bash
# 设置环境变量
export NPM_REGISTRY=http://git-server:3000/api/npm
export GIT_SERVER=http://git-server:3000

# 使用环境变量
npm config set registry $NPM_REGISTRY
git clone $GIT_SERVER/git/repo-name.git
```

---

## 📞 技术支持

如果遇到问题，请按以下顺序排查：

1. **检查网络连接**：确认能访问服务器地址
2. **验证凭据**：确认用户名密码正确
3. **检查权限**：联系管理员确认账户权限
4. **查看日志**：管理员可在Web界面查看操作日志
5. **联系支持**：提供详细的错误信息和操作步骤

**管理员联系方式**：
- Web管理界面：`http://your-server:3000`
- 邮箱：admin@company.com
- 内部工单系统：...

---

## 📚 相关文档

- [NPM权限管理指南](NPM-PERMISSION-GUIDE.md)
- [Git仓库管理说明](README.md)
- [系统架构文档](ARCHITECTURE.md)
- [故障排除指南](TROUBLESHOOTING.md)
