<template>
	<div class="user-management">
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
							<h2>用户管理</h2>
							<p class="header-desc">管理系统用户和角色权限</p>
						</div>
					</div>
					<el-button type="primary" @click="showCreateDialog = true">
						<el-icon><Plus /></el-icon>
						新建用户
					</el-button>
				</div>
			</template>

			<el-table :data="users" v-loading="loading">
				<el-table-column prop="username" label="用户名" width="200" />
				<el-table-column prop="email" label="邮箱" width="200" />
				<el-table-column prop="role" label="角色" width="150">
					<template #default="{ row }">
						<el-tag :type="getRoleType(row.role)">
							{{ getRoleLabel(row.role) }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="createdAt" label="创建时间" width="170">
					<template #default="{ row }">
						{{ formatTime(row.createdAt) }}
					</template>
				</el-table-column>
				<el-table-column prop="lastLogin" label="最后登录" width="170">
					<template #default="{ row }">
						{{
							row.lastLogin
								? formatTime(row.lastLogin)
								: "从未登录"
						}}
					</template>
				</el-table-column>
				<el-table-column label="操作" align="center">
					<template #default="{ row }">
						<el-button
							size="small"
							@click="openEditDialog(row)"
							:disabled="!canEditUser(row)"
						>
							编辑
						</el-button>
						<el-button
							size="small"
							@click="openRoleDialog(row)"
							:disabled="!canEditUser(row)"
						>
							修改角色
						</el-button>
						<el-button
							size="small"
							type="warning"
							@click="openResetPasswordDialog(row)"
							:disabled="!canEditUser(row)"
						>
							重置密码
						</el-button>
						<el-button
							size="small"
							type="danger"
							@click="handleDelete(row)"
							:disabled="!canEditUser(row)"
						>
							删除
						</el-button>
					</template>
				</el-table-column>
			</el-table>
		</el-card>

		<!-- 创建用户对话框 -->
		<el-dialog v-model="showCreateDialog" title="创建新用户" width="500px">
			<el-form
				:model="createForm"
				:rules="createRules"
				ref="createFormRef"
				label-width="100px"
			>
				<el-form-item label="用户名" prop="username">
					<el-input
						v-model="createForm.username"
						placeholder="请输入用户名"
					/>
				</el-form-item>
				<el-form-item label="密码" prop="password">
					<el-input
						v-model="createForm.password"
						type="password"
						placeholder="请输入密码（至少6位）"
						show-password
					/>
				</el-form-item>
				<el-form-item label="邮箱" prop="email">
					<el-input
						v-model="createForm.email"
						placeholder="请输入邮箱"
					/>
				</el-form-item>
				<el-form-item label="角色" prop="role">
					<el-select
						v-model="createForm.role"
						placeholder="选择角色"
						style="width: 100%"
					>
						<el-option
							v-for="role in availableRoles"
							:key="role.value"
							:label="role.label"
							:value="role.value"
						/>
					</el-select>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="showCreateDialog = false">取消</el-button>
				<el-button
					type="primary"
					@click="handleCreate"
					:loading="creating"
				>
					创建
				</el-button>
			</template>
		</el-dialog>

		<!-- 编辑用户对话框 -->
		<el-dialog v-model="showEditDialog" title="编辑用户信息" width="500px">
			<el-form
				:model="editForm"
				:rules="editRules"
				ref="editFormRef"
				label-width="100px"
			>
				<el-form-item label="原用户名">
					<el-input :value="currentUser?.username" disabled />
				</el-form-item>
				<el-form-item label="新用户名" prop="username">
					<el-input
						v-model="editForm.username"
						placeholder="请输入新用户名"
					/>
				</el-form-item>
				<el-form-item label="邮箱" prop="email">
					<el-input
						v-model="editForm.email"
						placeholder="请输入邮箱"
					/>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="showEditDialog = false">取消</el-button>
				<el-button
					type="primary"
					@click="handleEdit"
					:loading="editing"
				>
					保存
				</el-button>
			</template>
		</el-dialog>

		<!-- 修改角色对话框 -->
		<el-dialog v-model="showRoleDialog" title="修改用户角色" width="400px">
			<el-alert
				v-if="authUtils.isSuperAdmin()"
				type="info"
				:closable="false"
				style="margin-bottom: 16px"
			>
				超级管理员只有一个，不允许修改为超级管理员
			</el-alert>
			<el-form label-width="100px">
				<el-form-item label="用户名">
					<el-input :value="currentUser?.username" disabled />
				</el-form-item>
				<el-form-item label="当前角色">
					<el-tag :type="getRoleType(currentUser?.role)">
						{{ getRoleLabel(currentUser?.role) }}
					</el-tag>
				</el-form-item>
				<el-form-item label="新角色">
					<el-select
						v-model="newRole"
						placeholder="选择新角色"
						style="width: 100%"
					>
						<el-option
							v-for="role in availableRolesForUpdate"
							:key="role.value"
							:label="role.label"
							:value="role.value"
						/>
					</el-select>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="showRoleDialog = false">取消</el-button>
				<el-button
					type="primary"
					@click="handleUpdateRole"
					:loading="updating"
				>
					确定
				</el-button>
			</template>
		</el-dialog>

		<!-- 重置密码对话框 -->
		<el-dialog
			v-model="showResetPasswordDialog"
			title="重置用户密码"
			width="400px"
		>
			<el-form
				:model="resetPasswordForm"
				:rules="resetPasswordRules"
				ref="resetPasswordFormRef"
				label-width="100px"
			>
				<el-form-item label="用户名">
					<el-input :value="currentUser?.username" disabled />
				</el-form-item>
				<el-form-item label="新密码" prop="newPassword">
					<el-input
						v-model="resetPasswordForm.newPassword"
						type="password"
						placeholder="请输入新密码（至少6位）"
						show-password
					/>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="showResetPasswordDialog = false"
					>取消</el-button
				>
				<el-button
					type="primary"
					@click="handleResetPassword"
					:loading="resetting"
				>
					确定
				</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { Plus, ArrowLeft } from "@element-plus/icons-vue"
import { userManagementService } from "../api/userManagement"
import { authUtils } from "../api/auth"

const users = ref([])
const loading = ref(false)
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showRoleDialog = ref(false)
const showResetPasswordDialog = ref(false)
const currentUser = ref(null)
const creating = ref(false)
const editing = ref(false)
const updating = ref(false)
const resetting = ref(false)
const newRole = ref("")

const createForm = ref({
	username: "",
	password: "",
	email: "",
	role: "user",
})

const editForm = ref({
	username: "",
	email: "",
})

const resetPasswordForm = ref({
	newPassword: "",
})

const createFormRef = ref()
const editFormRef = ref()
const resetPasswordFormRef = ref()

// 当前登录用户
const loginUser = computed(() => authUtils.getCurrentUser())

// 可用角色列表（创建用户）
const availableRoles = computed(() => {
	// 超级管理员只有一个，不允许创建新的超级管理员
	if (authUtils.isSuperAdmin()) {
		return [
			{ label: "管理员", value: "admin" },
			{ label: "普通用户", value: "user" },
		]
	} else {
		return [{ label: "普通用户", value: "user" }]
	}
})

// 可用角色列表（修改角色）
const availableRolesForUpdate = computed(() => {
	// 不允许修改为超级管理员
	if (authUtils.isSuperAdmin()) {
		return [
			{ label: "管理员", value: "admin" },
			{ label: "普通用户", value: "user" },
		]
	} else {
		return [{ label: "普通用户", value: "user" }]
	}
})

// 表单验证规则
const createRules = {
	username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
	password: [
		{ required: true, message: "请输入密码", trigger: "blur" },
		{ min: 6, message: "密码长度不能少于6位", trigger: "blur" },
	],
	role: [{ required: true, message: "请选择角色", trigger: "change" }],
}

const editRules = {
	username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
}

const resetPasswordRules = {
	newPassword: [
		{ required: true, message: "请输入新密码", trigger: "blur" },
		{ min: 6, message: "密码长度不能少于6位", trigger: "blur" },
	],
}

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

// 格式化时间
const formatTime = (timestamp) => {
	const date = new Date(timestamp)
	return date.toLocaleString("zh-CN")
}

// 判断是否可以编辑用户
const canEditUser = (user) => {
	// 不能编辑自己
	if (user.username === loginUser.value?.username) {
		return false
	}

	// 超管可以编辑所有人
	if (authUtils.isSuperAdmin()) {
		return true
	}

	// 普通管理员只能编辑普通用户
	if (authUtils.isAdmin()) {
		return user.role === "user"
	}

	return false
}

// 加载用户列表
const loadUsers = async () => {
	loading.value = true
	try {
		const response = await userManagementService.getUsers()
		users.value = response.data || []
	} catch (error) {
		ElMessage.error("加载用户列表失败")
		console.error(error)
	} finally {
		loading.value = false
	}
}

// 创建用户
const handleCreate = async () => {
	if (!createFormRef.value) return

	const valid = await createFormRef.value.validate().catch(() => false)
	if (!valid) return

	creating.value = true
	try {
		await userManagementService.createUser(createForm.value)
		ElMessage.success("用户创建成功")
		showCreateDialog.value = false
		createForm.value = {
			username: "",
			password: "",
			email: "",
			role: "user",
		}
		loadUsers()
	} catch (error) {
		ElMessage.error(error.response?.data?.error || "创建失败")
		console.error(error)
	} finally {
		creating.value = false
	}
}

// 打开编辑对话框
const openEditDialog = (user) => {
	currentUser.value = user
	editForm.value = {
		username: user.username,
		email: user.email || "",
	}
	showEditDialog.value = true
}

// 编辑用户
const handleEdit = async () => {
	if (!editFormRef.value) return

	const valid = await editFormRef.value.validate().catch(() => false)
	if (!valid) return

	// 检查是否有修改
	if (
		editForm.value.username === currentUser.value.username &&
		editForm.value.email === currentUser.value.email
	) {
		ElMessage.warning("未做任何修改")
		return
	}

	editing.value = true
	try {
		await userManagementService.updateUser(
			currentUser.value.username,
			editForm.value
		)
		ElMessage.success("用户信息修改成功")
		showEditDialog.value = false
		loadUsers()
	} catch (error) {
		ElMessage.error(error.response?.data?.error || "修改失败")
		console.error(error)
	} finally {
		editing.value = false
	}
}

// 打开修改角色对话框
const openRoleDialog = (user) => {
	currentUser.value = user
	newRole.value = user.role
	showRoleDialog.value = true
}

// 修改用户角色
const handleUpdateRole = async () => {
	if (!currentUser.value || !newRole.value) return

	if (newRole.value === currentUser.value.role) {
		ElMessage.warning("角色未变更")
		return
	}

	updating.value = true
	try {
		await userManagementService.updateUserRole(
			currentUser.value.username,
			newRole.value
		)
		ElMessage.success("角色修改成功，用户需要重新登录")
		showRoleDialog.value = false
		loadUsers()
	} catch (error) {
		ElMessage.error(error.response?.data?.error || "修改失败")
		console.error(error)
	} finally {
		updating.value = false
	}
}

// 打开重置密码对话框
const openResetPasswordDialog = (user) => {
	currentUser.value = user
	resetPasswordForm.value.newPassword = ""
	showResetPasswordDialog.value = true
}

// 重置密码
const handleResetPassword = async () => {
	if (!resetPasswordFormRef.value) return

	const valid = await resetPasswordFormRef.value.validate().catch(() => false)
	if (!valid) return

	resetting.value = true
	try {
		await userManagementService.resetPassword(
			currentUser.value.username,
			resetPasswordForm.value.newPassword
		)
		ElMessage.success("密码重置成功，用户需要重新登录")
		showResetPasswordDialog.value = false
	} catch (error) {
		ElMessage.error(error.response?.data?.error || "重置失败")
		console.error(error)
	} finally {
		resetting.value = false
	}
}

// 删除用户
const handleDelete = async (user) => {
	try {
		await ElMessageBox.confirm(
			`确定要删除用户 "${user.username}" 吗？此操作不可恢复。`,
			"确认删除",
			{
				confirmButtonText: "确定",
				cancelButtonText: "取消",
				type: "warning",
			}
		)

		await userManagementService.deleteUser(user.username)
		ElMessage.success("用户删除成功")
		loadUsers()
	} catch (error) {
		if (error !== "cancel") {
			ElMessage.error(error.response?.data?.error || "删除失败")
			console.error(error)
		}
	}
}

onMounted(() => {
	loadUsers()
})
</script>

<style scoped>
.user-management {
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

/* 响应式设计 */
@media (max-width: 768px) {
	.user-management {
		padding: 24px 16px;
	}

	.card-header {
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
	}

	.header-left {
		width: 100%;
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
	}

	.back-button {
		width: 100%;
	}

	.card-header .el-button[type="primary"] {
		width: 100%;
	}
}
</style>
