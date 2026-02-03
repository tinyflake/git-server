# Git Clone 测试指南

## 测试场景说明

本文档说明了在不同情况下Git clone操作的预期行为和用户体验。

## 🔍 测试场景

### 场景1：公开仓库克隆（无需认证）

**命令**：
```bash
git clone http://localhost:3000/git/test.git
```

**预期行为**：
- ✅ 直接开始克隆，无需输入用户名密码
- ✅ 成功下载仓库内容
- ✅ 在日志中记录为匿名用户操作

**实际测试**：
```bash
# 在新目录中测试
mkdir test-clone && cd test-clone
git clone http://localhost:3000/git/test.git
```

### 场景2：私有仓库克隆（需要认证）

**前提条件**：仓库设置了访问白名单

**命令**：
```bash
git clone http://localhost:3000/git/private-repo.git
```

**预期行为**：
1. Git客户端发送初始请求
2. 服务器返回401 Unauthorized
3. Git客户端提示输入用户名和密码
4. 用户输入凭据
5. 服务器验证凭据和权限
6. 验证成功后开始传输

**用户看到的提示**：
```
Username for 'http://localhost:3000': your-username
Password for 'http://your-username@localhost:3000': [输入密码]
```

### 场景3：无权限访问

**命令**：
```bash
git clone http://localhost:3000/git/restricted-repo.git
```

**预期行为**：
- 提示输入用户名密码
- 即使凭据正确，如果用户不在白名单中，返回403错误
- 显示权限不足的错误信息

**错误信息**：
```
fatal: Authentication failed for 'http://localhost:3000/git/restricted-repo.git/'
```

### 场景4：仓库不存在

**命令**：
```bash
git clone http://localhost:3000/git/nonexistent-repo.git
```

**预期行为**：
- 返回404错误
- 显示仓库不存在的错误信息

**错误信息**：
```
fatal: repository 'http://localhost:3000/git/nonexistent-repo.git/' not found
```

## 🔐 认证流程详解

### HTTP Basic Authentication

当Git需要认证时，会发送包含Authorization头的请求：

```
Authorization: Basic base64(username:password)
```

### 服务器端处理流程

1. **解析请求**：提取仓库名和操作类型
2. **权限检查**：
   - 对于clone/pull：检查仓库访问权限
   - 对于push：强制要求认证
3. **用户验证**：验证用户名和密码
4. **权限验证**：检查用户是否在仓库白名单中
5. **执行操作**：权限验证通过后执行Git操作
6. **记录日志**：记录操作结果和用户信息

### 客户端凭据缓存

Git客户端会缓存认证凭据，避免重复输入：

**Windows**：
```bash
git config --global credential.helper manager-core
```

**macOS**：
```bash
git config --global credential.helper osxkeychain
```

**Linux**：
```bash
git config --global credential.helper cache
git config --global credential.helper 'cache --timeout=3600'
```

## 📊 日志记录

所有Git操作都会记录到 `backend/logs/git-operations.json`：

```json
{
  "id": "unique-id",
  "timestamp": "2026-01-26T17:09:41.180+08:00",
  "operation": "clone",
  "repository": "test",
  "user": {
    "username": "admin",
    "role": "super_admin"
  },
  "userAgent": "git/2.48.1.windows.1",
  "clientIP": "::1",
  "success": true,
  "error": null,
  "details": {
    "service": "git-upload-pack",
    "phase": "info/refs"
  },
  "duration": 108
}
```

**字段说明**：
- `timestamp`：UTC+8时间格式
- `user`：认证用户信息（匿名操作为null）
- `success`：操作是否成功
- `duration`：操作耗时（毫秒）

## 🚨 常见错误和解决方案

### 错误1：Authentication failed

**原因**：
- 用户名或密码错误
- 账户被禁用

**解决方案**：
1. 确认用户名密码正确
2. 联系管理员检查账户状态
3. 清除Git凭据缓存后重试

### 错误2：Repository not found

**原因**：
- 仓库名称错误
- 仓库不存在
- 用户无访问权限

**解决方案**：
1. 确认仓库名称正确
2. 联系管理员确认仓库存在
3. 检查用户权限设置

### 错误3：Access denied

**原因**：
- 用户不在仓库白名单中
- 仓库设置为私有

**解决方案**：
1. 联系管理员添加到白名单
2. 确认仓库访问权限设置

## 🧪 测试步骤

### 1. 准备测试环境

```bash
# 启动服务器
cd backend
npm start

# 在另一个终端准备测试目录
mkdir git-test && cd git-test
```

### 2. 测试公开仓库克隆

```bash
# 测试1：直接克隆
git clone http://localhost:3000/git/test.git test-public
cd test-public
ls -la

# 验证：应该成功下载，无需认证
```

### 3. 测试认证流程

```bash
# 测试2：推送操作（需要认证）
cd test-public
echo "test" > test.txt
git add test.txt
git commit -m "Test commit"
git push origin main

# 验证：应该提示输入用户名密码
```

### 4. 测试权限控制

```bash
# 测试3：使用不同用户身份
# 在Web界面中设置仓库为私有
# 然后尝试克隆
git clone http://localhost:3000/git/test.git test-private

# 验证：应该提示认证，且只有白名单用户能成功
```

### 5. 检查日志记录

访问 `http://localhost:3000` 查看操作日志，确认：
- 时间格式为UTC+8
- 用户信息正确记录
- 操作结果准确

## 📝 测试报告模板

```
测试日期：2026-01-26
测试环境：Windows 11 + Git 2.48.1
服务器版本：v2.0.0

测试结果：
□ 公开仓库克隆 - 通过/失败
□ 私有仓库认证 - 通过/失败  
□ 权限控制 - 通过/失败
□ 错误处理 - 通过/失败
□ 日志记录 - 通过/失败

问题记录：
1. [描述问题]
2. [解决方案]

建议改进：
1. [改进建议]
```

## 🔧 开发者调试

### 启用详细日志

```bash
# Git客户端详细日志
export GIT_CURL_VERBOSE=1
export GIT_TRACE=1

# 服务器端日志
# 在backend/app.js中已有详细的请求日志
```

### 网络抓包分析

使用Wireshark或Fiddler分析HTTP请求：
1. 观察认证流程
2. 检查错误响应
3. 验证数据传输

### 服务器端调试

```bash
# 查看实时日志
tail -f backend/logs/git-operations.json

# 检查用户权限
node -e "
const { canAccessRepo } = require('./utils/repo-permission');
console.log('用户权限:', canAccessRepo('username', 'user', 'test'));
"
```
