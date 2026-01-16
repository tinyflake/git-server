<template>
	<div class="permission-management">
		<el-card>
			<template #header>
				<div class="card-header">
					<div class="header-left">
						<el-button
							type="default"
							@click="$router.push('/')"
							class="back-button"
						>
							<el-icon><ArrowLeft /></el-icon>
							返回首页
						</el-button>
						<div class="header-title">
							<h2>仓库权限管理</h2>
							<p class="header-desc">
								设置仓库的访问白名单和代码查看权限
							</p>
						</div>
					</div>
				</div>
			</template>

			<el-table :data="repos" v-loading="loading">
				<el-table-column prop="repoName" label="仓库名称" width="200" />
				<el-table-column prop="desc" label="描述" />
				<el-table-column label="访问权限" width="150">
					<template #default="{ row }">
						<el-tag
							v-if="!row.whitelist || row.whitelist.length === 0"
							type="success"
						>
							公开
						</el-tag>
						<el-tag v-else type="warning">
							受限 ({{ row.whitelist.length }}人)
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="代码查看权限" width="180">
					<template #default="{ row }">
						<el-tag
							v-if="
								!row.codeViewPermission ||
								!row.codeViewPermission.enabled
							"
							type="info"
						>
							默认规则
						</el-tag>
						<el-tag
							v-else-if="
								row.codeViewPermission.allowedUsers.length === 0
							"
							type="success"
						>
							继承访问权限
						</el-tag>
						<el-tag v-else type="primary">
							自定义 ({{
								row.codeViewPermission.allowedUsers.length
							}}人)
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="操作" width="250" align="center">
					<template #default="{ row }">
						<el-button
							type="primary"
							size="small"
							@click="openWhitelistDialog(row)"
						>
							访问权限
						</el-button>
						<el-button
							type="success"
							size="small"
							@click="openCodeViewDialog(row)"
						>
							代码权限
						</el-button>
					</template>
				</el-table-column>
			</el-table>
		</el-card>

		<!-- 白名单设置对话框 -->
		<el-dialog
			v-model="whitelistDialogVisible"
			:title="`设置仓库访问权限 - ${currentRepo?.repoName}`"
			width="700px"
		>
			<div class="whitelist-dialog">
				<el-alert
					title="访问权限说明"
					type="info"
					:closable="false"
					style="margin-bottom: 20px"
				>
					<p>• 白名单为空时，所有用户都可以访问该仓库</p>
					<p>• 设置白名单后，只有名单中的用户可以访问</p>
					<p>• 超级管理员始终可以访问所有仓库</p>
				</el-alert>

				<el-form label-width="100px">
					<el-form-item label="访问模式">
						<el-radio-group v-model="accessMode">
							<el-radio value="public"
								>公开（所有人可见）</el-radio
							>
							<el-radio value="private"
								>私有（仅白名单用户）</el-radio
							>
						</el-radio-group>
					</el-form-item>

					<el-form-item
						label="白名单用户"
						v-if="accessMode === 'private'"
					>
						<div class="user-permission-table">
							<!-- 搜索框 -->
							<el-input
								v-model="whitelistSearchKeyword"
								placeholder="搜索用户名..."
								clearable
								style="margin-bottom: 12px"
							>
								<template #prefix>
									<el-icon><Search /></el-icon>
								</template>
							</el-input>

							<!-- 已选择统计 -->
							<div class="selected-info">
								已选择 {{ getWhitelistSelectedCount() }} 人
							</div>

							<!-- 用户列表 -->
							<div class="user-list">
								<div
									v-for="user in filteredWhitelistUsers"
									:key="user.username"
									class="user-item"
									:class="{
										disabled: user.role === 'super_admin',
									}"
								>
									<el-checkbox
										:model-value="
											isWhitelistUserSelected(user)
										"
										@change="
											(val) =>
												toggleWhitelistUserSelection(
													user,
													val
												)
										"
										:disabled="user.role === 'super_admin'"
									>
										<span class="user-info">
											<span class="username">{{
												user.username
											}}</span>
											<span class="email">{{
												user.email || "无邮箱"
											}}</span>
											<el-tag
												:type="getRoleType(user.role)"
												size="small"
											>
												{{ getRoleLabel(user.role) }}
											</el-tag>
											<el-tag
												v-if="
													user.role === 'super_admin'
												"
												type="info"
												size="small"
											>
												始终可访问
											</el-tag>
										</span>
									</el-checkbox>
								</div>
							</div>
						</div>
					</el-form-item>
				</el-form>
			</div>

			<template #footer>
				<el-button @click="whitelistDialogVisible = false"
					>取消</el-button
				>
				<el-button
					type="primary"
					@click="saveWhitelist"
					:loading="saving"
				>
					保存
				</el-button>
			</template>
		</el-dialog>

		<!-- 代码查看权限对话框 -->
		<el-dialog
			v-model="codeViewDialogVisible"
			:title="`设置代码查看权限 - ${currentRepo?.repoName}`"
			width="700px"
			@opened="handleDialogOpened"
		>
			<div class="code-view-dialog">
				<el-alert
					title="代码查看权限说明"
					type="info"
					:closable="false"
					style="margin-bottom: 20px"
				>
					<p>• 默认规则：超级管理员和管理员有权限，普通用户无权限</p>
					<p>• 启用自定义后，可以精确控制哪些用户可以查看代码</p>
					<p>• 继承访问权限：所有能访问仓库的用户都能查看代码</p>
					<p>• 超级管理员始终有代码查看权限</p>
				</el-alert>

				<el-form label-width="120px">
					<el-form-item label="权限模式">
						<el-radio-group v-model="codeViewMode">
							<el-radio value="default">默认规则</el-radio>
							<el-radio value="inherit">继承访问权限</el-radio>
							<el-radio value="custom">自定义</el-radio>
						</el-radio-group>
					</el-form-item>

					<el-form-item
						label="用户权限列表"
						v-if="codeViewMode === 'custom'"
					>
						<div class="user-permission-table">
							<!-- 搜索框 -->
							<el-input
								v-model="userSearchKeyword"
								placeholder="搜索用户名..."
								clearable
								style="margin-bottom: 12px"
							>
								<template #prefix>
									<el-icon><Search /></el-icon>
								</template>
							</el-input>

							<!-- 已选择统计 -->
							<div class="selected-info">
								已选择 {{ getSelectedCount() }} 人
							</div>

							<!-- 用户列表 -->
							<div class="user-list">
								<div
									v-for="user in filteredUsers"
									:key="user.username"
									class="user-item"
									:class="{
										disabled: user.role === 'super_admin',
									}"
								>
									<el-checkbox
										:model-value="isUserSelected(user)"
										@change="
											(val) =>
												toggleUserSelection(user, val)
										"
										:disabled="user.role === 'super_admin'"
									>
										<span class="user-info">
											<span class="username">{{
												user.username
											}}</span>
											<span class="email">{{
												user.email || "无邮箱"
											}}</span>
											<el-tag
												:type="getRoleType(user.role)"
												size="small"
											>
												{{ getRoleLabel(user.role) }}
											</el-tag>
											<el-tag
												v-if="
													user.role === 'super_admin'
												"
												type="info"
												size="small"
											>
												始终有权限
											</el-tag>
										</span>
									</el-checkbox>
								</div>
							</div>
						</div>
					</el-form-item>
				</el-form>
			</div>

			<template #footer>
				<el-button @click="codeViewDialogVisible = false"
					>取消</el-button
				>
				<el-button
					type="primary"
					@click="saveCodeViewPermission"
					:loading="saving"
				>
					保存
				</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { ElMessage } from "element-plus"
import { ArrowLeft, Search } from "@element-plus/icons-vue"
import { repoManagementService } from "../api/repoManagement"
import { userManagementService } from "../api/userManagement"

const repos = ref([])
const allUsers = ref([])
const loading = ref(false)
const whitelistDialogVisible = ref(false)
const codeViewDialogVisible = ref(false)
const currentRepo = ref(null)
const selectedWhitelist = ref([])
const selectedCodeViewUsers = ref([])
const accessMode = ref("public")
const codeViewMode = ref("default")
const saving = ref(false)
const userSearchKeyword = ref("")
const whitelistSearchKeyword = ref("")

// 获取角色标签
const getRoleLabel = (role) => {
	const labels = {
		super_admin: "超级管理员",
		admin: "管理员",
		user: "普通用户",
	}
	return labels[role] || role
}

// 获取角色类型
const getRoleType = (role) => {
	const types = {
		super_admin: "danger",
		admin: "warning",
		user: "info",
	}
	return types[role] || "info"
}

// 过滤后的用户列表（代码查看）
const filteredUsers = computed(() => {
	if (!Array.isArray(allUsers.value)) {
		return []
	}
	if (!userSearchKeyword.value) {
		return allUsers.value
	}
	const keyword = userSearchKeyword.value.toLowerCase()
	return allUsers.value.filter(
		(user) =>
			user.username.toLowerCase().includes(keyword) ||
			(user.email && user.email.toLowerCase().includes(keyword))
	)
})

// 过滤后的用户列表（白名单）
const filteredWhitelistUsers = computed(() => {
	if (!Array.isArray(allUsers.value)) {
		return []
	}
	if (!whitelistSearchKeyword.value) {
		return allUsers.value
	}
	const keyword = whitelistSearchKeyword.value.toLowerCase()
	return allUsers.value.filter(
		(user) =>
			user.username.toLowerCase().includes(keyword) ||
			(user.email && user.email.toLowerCase().includes(keyword))
	)
})

// 判断用户是否被选中（代码查看）
const isUserSelected = (user) => {
	// 超级管理员始终选中
	if (user.role === "super_admin") {
		return true
	}
	return selectedCodeViewUsers.value.includes(user.username)
}

// 判断用户是否被选中（白名单）
const isWhitelistUserSelected = (user) => {
	// 超级管理员始终选中
	if (user.role === "super_admin") {
		return true
	}
	return selectedWhitelist.value.includes(user.username)
}

// 切换用户选中状态（代码查看）
const toggleUserSelection = (user, selected) => {
	if (user.role === "super_admin") return

	if (!Array.isArray(selectedCodeViewUsers.value)) {
		selectedCodeViewUsers.value = []
	}

	if (selected) {
		if (!selectedCodeViewUsers.value.includes(user.username)) {
			selectedCodeViewUsers.value.push(user.username)
		}
	} else {
		const index = selectedCodeViewUsers.value.indexOf(user.username)
		if (index > -1) {
			selectedCodeViewUsers.value.splice(index, 1)
		}
	}
}

// 切换用户选中状态（白名单）
const toggleWhitelistUserSelection = (user, selected) => {
	if (user.role === "super_admin") return

	if (!Array.isArray(selectedWhitelist.value)) {
		selectedWhitelist.value = []
	}

	if (selected) {
		if (!selectedWhitelist.value.includes(user.username)) {
			selectedWhitelist.value.push(user.username)
		}
	} else {
		const index = selectedWhitelist.value.indexOf(user.username)
		if (index > -1) {
			selectedWhitelist.value.splice(index, 1)
		}
	}
}

// 获取选中数量（代码查看）
const getSelectedCount = () => {
	if (!Array.isArray(selectedCodeViewUsers.value)) {
		return 0
	}
	return selectedCodeViewUsers.value.length
}

// 获取选中数量（白名单）
const getWhitelistSelectedCount = () => {
	if (!Array.isArray(selectedWhitelist.value)) {
		return 0
	}
	return selectedWhitelist.value.length
}

// 加载仓库列表
const loadRepos = async () => {
	loading.value = true
	try {
		const response = await repoManagementService.getRepos()
		repos.value = response.data || []
	} catch (error) {
		ElMessage.error("加载仓库列表失败")
		console.error(error)
	} finally {
		loading.value = false
	}
}

// 加载用户列表
const loadUsers = async () => {
	try {
		const response = await userManagementService.getUsers()
		allUsers.value = response.data || []
	} catch (error) {
		console.error("加载用户列表失败:", error)
	}
}

// 打开代码查看权限对话框
const openCodeViewDialog = async (repo) => {
	currentRepo.value = repo
	userSearchKeyword.value = ""

	// 确保用户列表已加载
	if (allUsers.value.length === 0) {
		await loadUsers()
	}

	// 加载当前代码查看权限
	try {
		const response = await repoManagementService.getCodeViewPermission(
			repo.repoName
		)
		const permission = response.data

		if (!permission.enabled) {
			codeViewMode.value = "default"
			selectedCodeViewUsers.value = []
		} else if (permission.allowedUsers.length === 0) {
			codeViewMode.value = "inherit"
			selectedCodeViewUsers.value = []
		} else {
			codeViewMode.value = "custom"
			selectedCodeViewUsers.value = [...permission.allowedUsers]
		}
	} catch (error) {
		ElMessage.error("加载代码查看权限失败")
		console.error(error)
		return
	}

	codeViewDialogVisible.value = true
}

// 对话框打开后的回调
const handleDialogOpened = () => {
	console.log("对话框已打开")
	console.log("当前模式:", codeViewMode.value)
	console.log("选中的用户:", selectedCodeViewUsers.value)
	console.log(
		"所有用户:",
		Array.isArray(allUsers.value)
			? allUsers.value.map((u) => u.username)
			: []
	)
}

// 保存代码查看权限
const saveCodeViewPermission = async () => {
	if (!currentRepo.value) return

	saving.value = true
	try {
		let enabled = false
		let allowedUsers = []

		if (codeViewMode.value === "default") {
			enabled = false
			allowedUsers = []
		} else if (codeViewMode.value === "inherit") {
			enabled = true
			allowedUsers = []
		} else {
			enabled = true
			allowedUsers = selectedCodeViewUsers.value
		}

		await repoManagementService.setCodeViewPermission(
			currentRepo.value.repoName,
			enabled,
			allowedUsers
		)

		ElMessage.success("代码查看权限设置成功")
		codeViewDialogVisible.value = false

		// 更新本地数据
		const repo = repos.value.find(
			(r) => r.repoName === currentRepo.value.repoName
		)
		if (repo && Array.isArray(repos.value)) {
			repo.codeViewPermission = {
				enabled: enabled,
				allowedUsers: allowedUsers,
			}
		}
	} catch (error) {
		ElMessage.error(error.response?.data?.error || "保存失败")
		console.error(error)
	} finally {
		saving.value = false
	}
}

// 打开白名单设置对话框
const openWhitelistDialog = async (repo) => {
	currentRepo.value = repo
	whitelistSearchKeyword.value = ""

	// 确保用户列表已加载
	if (allUsers.value.length === 0) {
		await loadUsers()
	}

	// 加载当前白名单
	try {
		const response = await repoManagementService.getWhitelist(repo.repoName)
		const whitelist = response.data.whitelist || []
		selectedWhitelist.value = [...whitelist]
		accessMode.value = whitelist.length === 0 ? "public" : "private"
	} catch (error) {
		ElMessage.error("加载白名单失败")
		console.error(error)
		return
	}

	whitelistDialogVisible.value = true
}

// 保存白名单
const saveWhitelist = async () => {
	if (!currentRepo.value) return

	saving.value = true
	try {
		const whitelist =
			accessMode.value === "public" ? [] : selectedWhitelist.value
		await repoManagementService.setWhitelist(
			currentRepo.value.repoName,
			whitelist
		)

		ElMessage.success("白名单设置成功")
		whitelistDialogVisible.value = false

		// 更新本地数据
		const repo = repos.value.find(
			(r) => r.repoName === currentRepo.value.repoName
		)
		if (repo && Array.isArray(repos.value)) {
			repo.whitelist = whitelist
		}
	} catch (error) {
		ElMessage.error(error.response?.data?.error || "保存失败")
		console.error(error)
	} finally {
		saving.value = false
	}
}

onMounted(() => {
	loadRepos()
	loadUsers()
})
</script>

<style scoped>
.permission-management {
	max-width: 1400px;
	margin: 0 auto;
	padding: 32px 24px;
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.header-left {
	display: flex;
	align-items: center;
	gap: 16px;
	flex: 1;
}

.back-button {
	flex-shrink: 0;
}

.header-title {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.card-header h2 {
	margin: 0;
	font-size: 20px;
	font-weight: 600;
	line-height: 1.2;
}

.header-desc {
	margin: 0;
	color: #6b7280;
	font-size: 14px;
	line-height: 1.2;
}

.user-permission-table {
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 16px;
	background-color: #f9fafb;
}

.selected-info {
	margin-bottom: 12px;
	font-size: 14px;
	color: #6b7280;
	font-weight: 500;
}

.user-list {
	max-height: 400px;
	overflow-y: auto;
}

.user-item {
	padding: 12px;
	border-bottom: 1px solid #e5e7eb;
	transition: background-color 0.2s;
}

.user-item:hover {
	background-color: #f3f4f6;
}

.user-item:last-child {
	border-bottom: none;
}

.user-item.disabled {
	background-color: #f9fafb;
	opacity: 0.7;
}

.user-info {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-left: 8px;
}

.username {
	font-weight: 500;
	min-width: 100px;
}

.email {
	color: #6b7280;
	font-size: 13px;
	min-width: 150px;
}

/* 响应式设计 */
@media (max-width: 768px) {
	.permission-management {
		padding: 24px 16px;
	}

	.header-left {
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
	}

	.back-button {
		width: 100%;
	}
}
</style>
