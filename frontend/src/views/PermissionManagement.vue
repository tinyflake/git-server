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
							<h2>权限管理</h2>
							<p class="header-desc">
								管理仓库访问权限和NPM发布权限
							</p>
						</div>
					</div>
				</div>
			</template>

			<!-- 权限管理标签页 -->
			<el-tabs v-model="activeTab" class="permission-tabs">
				<!-- 仓库权限管理 -->
				<el-tab-pane label="仓库权限" name="repo">
					<div class="tab-content">
						<p class="tab-desc">
							设置仓库的访问白名单和代码查看权限
						</p>

						<el-table :data="repos" v-loading="loading">
							<el-table-column
								prop="repoName"
								label="仓库名称"
								width="200"
							/>
							<el-table-column prop="desc" label="描述" />
							<el-table-column label="访问权限" width="150">
								<template #default="{ row }">
									<el-tag
										v-if="
											!row.whitelist ||
											row.whitelist.length === 0
										"
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
											row.codeViewPermission.allowedUsers
												.length === 0
										"
										type="success"
									>
										继承访问权限
									</el-tag>
									<el-tag v-else type="primary">
										自定义 ({{
											row.codeViewPermission.allowedUsers
												.length
										}}人)
									</el-tag>
								</template>
							</el-table-column>
							<el-table-column
								label="操作"
								width="250"
								align="center"
							>
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
					</div>
				</el-tab-pane>

				<!-- NPM权限管理 -->
				<el-tab-pane label="NPM权限" name="npm">
					<div class="tab-content">
						<p class="tab-desc">管理用户的NPM仓库访问和发布权限</p>

						<el-table :data="npmUsers" v-loading="npmLoading">
							<el-table-column
								prop="username"
								label="用户名"
								width="150"
							/>
							<el-table-column
								prop="email"
								label="邮箱"
								width="200"
							/>
							<el-table-column label="角色" width="120">
								<template #default="{ row }">
									<el-tag
										:type="getRoleType(row.role)"
										size="small"
									>
										{{ getRoleLabel(row.role) }}
									</el-tag>
								</template>
							</el-table-column>
							<el-table-column
								label="登录权限"
								width="100"
								align="center"
							>
								<template #default="{ row }">
									<el-tag
										:type="
											row.npmPermissions.canLogin
												? 'success'
												: 'danger'
										"
										size="small"
									>
										{{
											row.npmPermissions.canLogin
												? "允许"
												: "禁止"
										}}
									</el-tag>
								</template>
							</el-table-column>
							<el-table-column
								label="发布权限"
								width="100"
								align="center"
							>
								<template #default="{ row }">
									<el-tag
										:type="
											row.npmPermissions.canPublish
												? 'success'
												: 'info'
										"
										size="small"
									>
										{{
											row.npmPermissions.canPublish
												? "允许"
												: "禁止"
										}}
									</el-tag>
								</template>
							</el-table-column>
							<el-table-column
								label="管理权限"
								width="100"
								align="center"
							>
								<template #default="{ row }">
									<el-tag
										:type="
											row.npmPermissions.canManage
												? 'success'
												: 'info'
										"
										size="small"
									>
										{{
											row.npmPermissions.canManage
												? "允许"
												: "禁止"
										}}
									</el-tag>
								</template>
							</el-table-column>
							<el-table-column label="允许的包" width="200">
								<template #default="{ row }">
									<span
										v-if="
											row.npmPermissions.allowedPackages.includes(
												'*',
											)
										"
									>
										<el-tag type="success" size="small"
											>所有包</el-tag
										>
									</span>
									<span
										v-else-if="
											row.npmPermissions.allowedPackages
												.length === 0
										"
									>
										<el-tag type="info" size="small"
											>无</el-tag
										>
									</span>
									<span v-else>
										<el-tag
											v-for="pkg in row.npmPermissions.allowedPackages.slice(
												0,
												2,
											)"
											:key="pkg"
											size="small"
											style="margin-right: 4px"
										>
											{{ pkg }}
										</el-tag>
										<span
											v-if="
												row.npmPermissions
													.allowedPackages.length > 2
											"
										>
											+{{
												row.npmPermissions
													.allowedPackages.length - 2
											}}
										</span>
									</span>
								</template>
							</el-table-column>
							<el-table-column label="状态" width="100">
								<template #default="{ row }">
									<el-tag
										v-if="row.isMigrated"
										type="warning"
										size="small"
									>
										迁移用户
									</el-tag>
									<el-tag v-else type="primary" size="small">
										正常
									</el-tag>
								</template>
							</el-table-column>
							<el-table-column
								label="操作"
								width="120"
								align="center"
							>
								<template #default="{ row }">
									<el-button
										type="primary"
										size="small"
										@click="openNPMPermissionDialog(row)"
									>
										编辑权限
									</el-button>
								</template>
							</el-table-column>
						</el-table>
					</div>
				</el-tab-pane>
			</el-tabs>
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
													val,
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

		<!-- NPM权限设置对话框 -->
		<el-dialog
			v-model="npmPermissionDialogVisible"
			:title="`设置NPM权限 - ${currentNPMUser?.username}`"
			width="600px"
		>
			<div class="npm-permission-dialog">
				<el-alert
					title="NPM权限说明"
					type="info"
					:closable="false"
					style="margin-bottom: 20px"
				>
					<p>• 登录权限：是否允许用户使用 npm login 登录到私有仓库</p>
					<p>• 发布权限：是否允许用户发布NPM包</p>
					<p>• 管理权限：是否允许用户删除、废弃NPM包</p>
					<p>• 包权限：精确控制用户可以发布的包名</p>
				</el-alert>

				<el-form :model="npmPermissionForm" label-width="100px">
					<el-form-item label="登录权限">
						<el-switch
							v-model="npmPermissionForm.canLogin"
							active-text="允许"
							inactive-text="禁止"
						/>
					</el-form-item>

					<el-form-item label="发布权限">
						<el-switch
							v-model="npmPermissionForm.canPublish"
							active-text="允许"
							inactive-text="禁止"
						/>
					</el-form-item>

					<el-form-item label="管理权限">
						<el-switch
							v-model="npmPermissionForm.canManage"
							active-text="允许"
							inactive-text="禁止"
						/>
					</el-form-item>

					<el-form-item label="包权限">
						<div class="package-permission">
							<el-radio-group v-model="packagePermissionMode">
								<el-radio value="none"
									>不允许发布任何包</el-radio
								>
								<el-radio value="all">允许发布所有包</el-radio>
								<el-radio value="custom">自定义包列表</el-radio>
							</el-radio-group>

							<div
								v-if="packagePermissionMode === 'custom'"
								class="custom-packages"
							>
								<!-- 现有包列表选择 -->
								<div
									class="existing-packages"
									v-if="availablePackages.length > 0"
								>
									<el-text class="package-section-title"
										>从现有包中选择：</el-text
									>
									<div class="package-selection-grid">
										<el-checkbox
											v-for="pkg in availablePackages"
											:key="pkg.name"
											:model-value="
												npmPermissionForm.allowedPackages.includes(
													pkg.name,
												)
											"
											@change="
												(val) =>
													togglePackageSelection(
														pkg.name,
														val,
													)
											"
											class="package-checkbox"
										>
											<div class="package-info">
												<span class="package-name">{{
													pkg.name
												}}</span>
												<span class="package-desc">{{
													pkg.description || "无描述"
												}}</span>
											</div>
										</el-checkbox>
									</div>
								</div>

								<!-- 手动添加包名 -->
								<div class="manual-add-package">
									<el-text class="package-section-title"
										>手动添加包名：</el-text
									>
									<el-input
										v-model="newPackageName"
										placeholder="输入包名，如：@company/ui-button"
										@keyup.enter="addPackage"
										style="margin-top: 8px"
									>
										<template #append>
											<el-button @click="addPackage"
												>添加</el-button
											>
										</template>
									</el-input>
								</div>

								<!-- 已选择的包列表 -->
								<div
									class="selected-packages"
									v-if="
										npmPermissionForm.allowedPackages
											.length > 0
									"
								>
									<el-text class="package-section-title"
										>已选择的包：</el-text
									>
									<div class="package-list">
										<el-tag
											v-for="(
												pkg, index
											) in npmPermissionForm.allowedPackages"
											:key="index"
											closable
											@close="removePackage(index)"
											style="margin: 4px 4px 0 0"
										>
											{{ pkg }}
										</el-tag>
									</div>
								</div>
							</div>
						</div>
					</el-form-item>
				</el-form>
			</div>

			<template #footer>
				<el-button @click="npmPermissionDialogVisible = false"
					>取消</el-button
				>
				<el-button
					type="primary"
					@click="saveNPMPermission"
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

// 基础数据
const repos = ref([])
const allUsers = ref([])
const npmUsers = ref([])
const loading = ref(false)
const npmLoading = ref(false)
const activeTab = ref("repo")

// 仓库权限相关
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

// NPM权限相关
const npmPermissionDialogVisible = ref(false)
const currentNPMUser = ref(null)
const npmPermissionForm = ref({
	canLogin: true,
	canPublish: false,
	canManage: false,
	allowedPackages: [],
})
const packagePermissionMode = ref("none")
const newPackageName = ref("")
const availablePackages = ref([])

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
			(user.email && user.email.toLowerCase().includes(keyword)),
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
			(user.email && user.email.toLowerCase().includes(keyword)),
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
			repo.repoName,
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
			: [],
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
			allowedUsers,
		)

		ElMessage.success("代码查看权限设置成功")
		codeViewDialogVisible.value = false

		// 更新本地数据
		const repo = repos.value.find(
			(r) => r.repoName === currentRepo.value.repoName,
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
			whitelist,
		)

		ElMessage.success("白名单设置成功")
		whitelistDialogVisible.value = false

		// 更新本地数据
		const repo = repos.value.find(
			(r) => r.repoName === currentRepo.value.repoName,
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

// NPM权限管理方法
// 加载NPM用户列表
const loadNPMUsers = async () => {
	npmLoading.value = true
	try {
		const response = await fetch(
			"/api/npm-permissions/users/npm-permissions",
			{
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			},
		)
		const data = await response.json()
		if (data.success) {
			npmUsers.value = data.users || []
		} else {
			ElMessage.error("加载NPM用户列表失败")
		}
	} catch (error) {
		ElMessage.error("加载NPM用户列表失败")
		console.error(error)
	} finally {
		npmLoading.value = false
	}
}

// 加载可用包列表
const loadAvailablePackages = async () => {
	try {
		const response = await fetch("/api/npm/packages", {
			headers: {
				Authorization: `Bearer ${localStorage.getItem("token")}`,
			},
		})
		const data = await response.json()
		if (data.code === 200) {
			availablePackages.value = data.data || []
		}
	} catch (error) {
		console.error("加载包列表失败:", error)
		// 不显示错误消息，因为这不是关键功能
	}
}

// 打开NPM权限设置对话框
const openNPMPermissionDialog = async (user) => {
	currentNPMUser.value = user

	// 加载可用包列表
	await loadAvailablePackages()

	// 初始化表单数据
	npmPermissionForm.value = {
		canLogin: user.npmPermissions.canLogin,
		canPublish: user.npmPermissions.canPublish,
		canManage: user.npmPermissions.canManage,
		allowedPackages: [...(user.npmPermissions.allowedPackages || [])],
	}

	// 设置包权限模式
	if (user.npmPermissions.allowedPackages.includes("*")) {
		packagePermissionMode.value = "all"
	} else if (user.npmPermissions.allowedPackages.length === 0) {
		packagePermissionMode.value = "none"
	} else {
		packagePermissionMode.value = "custom"
	}

	npmPermissionDialogVisible.value = true
}

// 添加包名
const addPackage = () => {
	const packageName = newPackageName.value.trim()
	if (!packageName) {
		ElMessage.warning("请输入包名")
		return
	}

	if (npmPermissionForm.value.allowedPackages.includes(packageName)) {
		ElMessage.warning("包名已存在")
		return
	}

	npmPermissionForm.value.allowedPackages.push(packageName)
	newPackageName.value = ""
}

// 切换包选择状态
const togglePackageSelection = (packageName, selected) => {
	if (selected) {
		if (!npmPermissionForm.value.allowedPackages.includes(packageName)) {
			npmPermissionForm.value.allowedPackages.push(packageName)
		}
	} else {
		const index =
			npmPermissionForm.value.allowedPackages.indexOf(packageName)
		if (index > -1) {
			npmPermissionForm.value.allowedPackages.splice(index, 1)
		}
	}
}

// 删除包名
const removePackage = (index) => {
	npmPermissionForm.value.allowedPackages.splice(index, 1)
}

// 保存NPM权限
const saveNPMPermission = async () => {
	if (!currentNPMUser.value) return

	saving.value = true
	try {
		// 根据模式设置允许的包
		let allowedPackages = []
		if (packagePermissionMode.value === "all") {
			allowedPackages = ["*"]
		} else if (packagePermissionMode.value === "custom") {
			allowedPackages = npmPermissionForm.value.allowedPackages
		}

		const permissionData = {
			canLogin: npmPermissionForm.value.canLogin,
			canPublish: npmPermissionForm.value.canPublish,
			canManage: npmPermissionForm.value.canManage,
			allowedPackages: allowedPackages,
		}

		const response = await fetch(
			`/api/npm-permissions/users/${currentNPMUser.value.username}/npm-permissions`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
				body: JSON.stringify(permissionData),
			},
		)

		const data = await response.json()
		if (data.success) {
			ElMessage.success("NPM权限设置成功")
			npmPermissionDialogVisible.value = false

			// 更新本地数据
			const userIndex = npmUsers.value.findIndex(
				(u) => u.username === currentNPMUser.value.username,
			)
			if (userIndex !== -1) {
				npmUsers.value[userIndex].npmPermissions = permissionData
			}
		} else {
			ElMessage.error(data.message || "NPM权限设置失败")
		}
	} catch (error) {
		ElMessage.error("NPM权限设置失败")
		console.error(error)
	} finally {
		saving.value = false
	}
}

onMounted(() => {
	loadRepos()
	loadUsers()
	loadNPMUsers()
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

.permission-tabs {
	margin-top: 20px;
}

.tab-content {
	padding-top: 16px;
}

.tab-desc {
	margin: 0 0 16px 0;
	color: #6b7280;
	font-size: 14px;
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

/* NPM权限对话框样式 */
.npm-permission-dialog {
	max-height: 600px;
	overflow-y: auto;
}

.package-permission {
	width: 100%;
}

.custom-packages {
	margin-top: 12px;
}

.package-section-title {
	font-weight: 500;
	color: #374151;
	margin-bottom: 8px;
	display: block;
}

.existing-packages {
	margin-bottom: 20px;
}

.package-selection-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 8px;
	margin-top: 8px;
	max-height: 200px;
	overflow-y: auto;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	padding: 12px;
	background-color: #f9fafb;
}

.package-checkbox {
	margin: 0;
}

.package-info {
	display: flex;
	flex-direction: column;
	margin-left: 8px;
}

.package-name {
	font-weight: 500;
	color: #374151;
	font-size: 14px;
}

.package-desc {
	color: #6b7280;
	font-size: 12px;
	margin-top: 2px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	max-width: 250px;
}

.manual-add-package {
	margin-bottom: 20px;
}

.selected-packages {
	margin-top: 16px;
}

.package-list {
	margin-top: 12px;
	padding: 12px;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	background-color: #f9fafb;
	min-height: 60px;
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
