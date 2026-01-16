# 代码查看权限修复总结

## 问题描述
用户反馈：当没有代码查看权限时，文件标签页仍然显示文件树和预览区的布局，而不是直接显示无权限提示。

## 解决方案

### 1. 后端新增权限检查接口
**文件**: `backend/routes/repo-routes.js`

新增接口：`GET /api/repo/check-code-permission`

```javascript
router.get("/check-code-permission", async (req, res) => {
	try {
		const repoPath = String(req.query.repoPath || "")
		const username = req.session?.user?.username

		if (!username) {
			return res.json({
				code: 401,
				msg: "未登录",
			})
		}

		const hasPermission = await authUtils.checkCodeViewPermission(
			username,
			repoPath
		)

		res.json({
			code: 200,
			data: {
				hasPermission: hasPermission,
			},
		})
	} catch (error) {
		res.json({
			code: 500,
			msg: "检查权限失败",
		})
	}
})
```

### 2. 后端权限检查函数
**文件**: `backend/utils/auth-utils.js`

新增函数：`checkCodeViewPermission`

```javascript
function checkCodeViewPermission(username, repoPath) {
	try {
		const user = findUserByUsername(username)
		if (!user) {
			return false
		}

		// 使用 repo-permission 中的 canViewCode 函数
		const { canViewCode, getRepoConfig } = require("./repo-permission")
		
		// 通过 repoPath 找到 repoName
		const config = getRepoConfig()
		const repo = config.repoList.find((r) => r.repoPath === repoPath)
		
		if (!repo) {
			return false
		}

		return canViewCode(username, user.role, repo.repoName)
	} catch (error) {
		console.error("检查代码查看权限失败:", error)
		return false
	}
}
```

**权限判断逻辑**（来自 `repo-permission.js` 的 `canViewCode`）：
1. 超级管理员永远有权限
2. 如果没有配置代码查看权限 → 管理员有权限，普通用户无权限
3. 如果未启用代码查看权限控制 → 管理员有权限，普通用户无权限
4. 如果启用了代码查看权限控制：
   - 允许列表为空 → 继承仓库访问权限
   - 允许列表不为空 → 检查用户是否在列表中

### 3. 前端 API 调用
**文件**: `frontend/src/api/repo.js`

新增方法：
```javascript
// 检查代码查看权限
checkCodePermission(repoPath) {
	return api.get("/repo/check-code-permission", { params: { repoPath } })
}
```

### 4. 前端权限检查 Composable
**文件**: `frontend/src/composables/useCodePermission.js`

修改为使用新的 API：
```javascript
const checkCodeViewPermission = async (repoPath) => {
	try {
		const response = await repoApi.checkCodePermission(repoPath)
		if (response.code === 200) {
			hasCodeViewPermission.value = response.data.hasPermission
		} else {
			hasCodeViewPermission.value = false
		}
	} catch (error) {
		console.error("检查代码查看权限失败:", error)
		hasCodeViewPermission.value = false
	}
}
```

### 5. 前端无权限提示优化
**文件**: `frontend/src/components/repo/FilesTab.vue`

改进无权限提示样式：
```vue
<div v-if="!hasCodeViewPermission" class="no-permission-container">
	<div class="no-permission-content">
		<el-icon class="no-permission-icon" :size="80">
			<Lock />
		</el-icon>
		<h3 class="no-permission-title">暂无权限，请联系管理员</h3>
		<p class="no-permission-desc">您没有查看此仓库代码的权限</p>
		<el-button type="primary" size="large" @click="contactAdmin">
			联系管理员开通权限
		</el-button>
	</div>
</div>
```

### 6. 主页面权限检查逻辑
**文件**: `frontend/src/views/RepoDetail.vue`

添加权限检查标记，避免重复检查：
```javascript
const hasCheckedFilePermission = ref(false)

watch(activeTab, async (newTab) => {
	if (newTab === "files" && repoInfo.value) {
		if (!hasCheckedFilePermission.value) {
			hasCheckedFilePermission.value = true
			await checkCodeViewPermission(repoInfo.value.repoPath)
			if (hasCodeViewPermission.value) {
				loadBranches()
			}
		}
	}
})
```

## 工作流程

1. 用户切换到"文件"标签页
2. 触发 `watch(activeTab)` 监听器
3. 调用 `checkCodeViewPermission(repoPath)` 检查权限
4. 后端通过 `canViewCode` 函数判断权限
5. 返回权限结果给前端
6. 前端根据权限结果：
   - **有权限** → 加载分支列表，显示文件树
   - **无权限** → 显示居中的无权限提示，不加载任何数据

## 测试要点

### 超级管理员
- ✅ 应该能看到所有仓库的代码

### 管理员
- ✅ 默认应该能看到所有仓库的代码
- ✅ 如果仓库启用了代码查看权限且管理员不在列表中，应该看不到

### 普通用户
- ✅ 默认看不到代码（如果没有配置权限）
- ✅ 如果在代码查看权限列表中，应该能看到
- ✅ 如果不在列表中，应该看到无权限提示

## 相关文件

### 后端
- `backend/routes/repo-routes.js` - 新增权限检查接口
- `backend/utils/auth-utils.js` - 新增权限检查函数
- `backend/utils/repo-permission.js` - 已有的权限判断逻辑

### 前端
- `frontend/src/api/repo.js` - 新增 API 方法
- `frontend/src/composables/useCodePermission.js` - 权限检查 composable
- `frontend/src/components/repo/FilesTab.vue` - 无权限提示组件
- `frontend/src/views/RepoDetail.vue` - 主页面权限检查逻辑

## 注意事项

1. **不要在 branches 接口中检查权限** - 这会导致逻辑混乱
2. **使用专门的权限检查接口** - 职责清晰，易于维护
3. **复用已有的权限判断逻辑** - 不要重复实现，使用 `canViewCode` 函数
4. **避免重复检查** - 使用标记位确保权限只检查一次
