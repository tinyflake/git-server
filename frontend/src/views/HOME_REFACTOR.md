# Home.vue 重构说明

## 📋 概述

原 Home.vue 文件有 1715 行代码，功能繁杂。现已拆分为多个独立的组件和组合式函数，提高了代码的可维护性和可复用性。

## 🗂️ 文件结构

### 组件 (Components)

#### 1. **HeaderBar.vue**
- 顶部导航栏组件
- 包含 Logo、用户菜单、创建仓库按钮、配置按钮
- 事件：`user-command`, `create-repo`, `open-config`

#### 2. **PackageCard.vue**
- 单个包/仓库的卡片组件
- 显示仓库名称、版本、描述、作者、日期、关键词
- 事件：`click`, `copy-install`, `edit-path`, `show-guide`

#### 3. **ConfigDialog.vue**
- 系统配置对话框
- 包管理器配置（npm/yarn/pnpm）
- 服务器配置（IP、端口、默认路径）
- 事件：`save`

#### 4. **CreateRepoDialog.vue**
- 创建新仓库对话框
- 表单验证
- 事件：`submit`

#### 5. **EditRepoPathDialog.vue**
- 修改仓库路径对话框
- 表单验证
- 事件：`submit`

#### 6. **ChangePasswordDialog.vue**
- 修改密码对话框
- 密码验证（长度、一致性）
- 事件：`submit`

#### 7. **RepoGuideDialog.vue**
- Git 操作指南对话框
- 新项目绑定步骤
- 克隆仓库步骤
- 命令复制功能

### 组合式函数 (Composables)

#### 1. **useAuth.js**
- 用户认证相关逻辑
- 修改密码功能
- 用户菜单命令处理
- 返回：`changePasswordLoading`, `handleChangePassword`, `handleUserCommand`

#### 2. **useRepoList.js**
- 仓库列表管理
- 加载仓库列表
- 获取仓库状态、提交信息、package.json 信息
- 返回：`repoList`, `loading`, `loadRepoList`

#### 3. **useRepoOperations.js**
- 仓库操作相关逻辑
- 创建仓库
- 更新仓库路径
- 显示仓库指南
- 复制安装命令
- 返回：`createLoading`, `editLoading`, `newRepoInfo`, `handleCreateRepo`, `handleUpdatePath`, `showRepoGuide`, `copyInstallCommand`

## 📊 代码统计

### 重构前
- **Home.vue**: 1715 行

### 重构后
- **Home.vue**: ~300 行
- **组件**: 7 个文件
- **组合式函数**: 3 个文件
- **总计**: 11 个文件

## ✨ 优势

1. **可维护性提升**
   - 每个组件职责单一
   - 代码结构清晰
   - 易于定位和修复问题

2. **可复用性提升**
   - 对话框组件可在其他页面复用
   - 组合式函数可在其他组件中使用

3. **可测试性提升**
   - 独立的组件和函数更容易编写单元测试
   - 逻辑与 UI 分离

4. **开发效率提升**
   - 多人协作时减少代码冲突
   - 新功能开发更快速

5. **性能优化**
   - 组件按需加载
   - 更好的代码分割

## 🔄 使用方式

Home.vue 现在只需导入组件和组合式函数：

```vue
<script setup>
import HeaderBar from "../components/HeaderBar.vue"
import PackageCard from "../components/PackageCard.vue"
import ConfigDialog from "../components/ConfigDialog.vue"
// ... 其他导入

import { useRepoList } from "../composables/useRepoList.js"
import { useRepoOperations } from "../composables/useRepoOperations.js"
import { useAuth } from "../composables/useAuth.js"

// 使用组合式函数
const { repoList, loading, loadRepoList } = useRepoList()
const { createLoading, handleCreateRepo, ... } = useRepoOperations(configForm, loadRepoList)
const { changePasswordLoading, handleChangePassword, ... } = useAuth()
</script>
```

## 🎯 未来扩展

如果需要添加新功能：

1. **新的对话框** → 创建新的 Dialog 组件
2. **新的业务逻辑** → 创建新的 composable 或扩展现有的
3. **新的卡片样式** → 扩展 PackageCard 组件或创建新的卡片组件

## 📝 注意事项

- 所有组件都使用 `<script setup>` 语法
- 使用 Element Plus 组件库
- 样式使用 scoped CSS
- 事件使用 emit 传递
- 表单验证在各自的对话框组件中处理
