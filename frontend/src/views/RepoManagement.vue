<template>
	<div class="repo-management">
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
							<h2>仓库管理</h2>
							<p class="header-desc">查看和管理所有 Git 仓库</p>
						</div>
					</div>
					<el-input
						v-model="searchKeyword"
						placeholder="搜索仓库名称"
						style="width: 300px"
						clearable
					>
						<template #prefix>
							<el-icon><Search /></el-icon>
						</template>
					</el-input>
				</div>
			</template>

			<el-table :data="filteredRepos" v-loading="loading">
				<el-table-column prop="repoName" label="仓库名称" width="200" />
				<el-table-column
					prop="desc"
					label="描述"
					min-width="200"
					show-overflow-tooltip
				/>
				<el-table-column prop="creator" label="创建者" width="120">
					<template #default="{ row }">
						<el-tag type="warning" size="small">
							{{ row.creator || "未知" }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="author" label="作者" width="150" />
				<el-table-column prop="version" label="版本" width="120" />
				<el-table-column
					prop="lastModified"
					label="最后修改时间"
					width="180"
				>
					<template #default="{ row }">
						{{ formatTime(row.lastModified) }}
					</template>
				</el-table-column>
				<el-table-column
					label="操作"
					width="120"
					fixed="right"
					align="center"
				>
					<template #default="{ row }">
						<el-button
							v-if="canDelete(row)"
							size="small"
							type="danger"
							@click="handleDelete(row)"
						>
							删除
						</el-button>
					</template>
				</el-table-column>
			</el-table>
		</el-card>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { ArrowLeft, Search } from "@element-plus/icons-vue"
import { repoApi } from "../api/repo"
import { authUtils } from "../api/auth"

const repos = ref([])
const loading = ref(false)
const searchKeyword = ref("")
const currentUser = ref(null)

// 过滤后的仓库列表
const filteredRepos = computed(() => {
	if (!Array.isArray(repos.value)) {
		return []
	}
	if (!searchKeyword.value) {
		return repos.value
	}
	const keyword = searchKeyword.value.toLowerCase()
	return repos.value.filter((repo) =>
		repo.repoName.toLowerCase().includes(keyword)
	)
})

// 判断是否可以删除
const canDelete = (repo) => {
	if (!currentUser.value) return false

	// 超管可以删除所有仓库
	if (currentUser.value.role === "super_admin") return true

	// 管理员只能删除自己创建的仓库
	if (currentUser.value.role === "admin") {
		return repo.creator === currentUser.value.username
	}

	return false
}

// 格式化时间
const formatTime = (dateString) => {
	if (!dateString) return "未知"
	const date = new Date(dateString)
	if (isNaN(date.getTime())) return "未知"

	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	const hours = String(date.getHours()).padStart(2, "0")
	const minutes = String(date.getMinutes()).padStart(2, "0")
	const seconds = String(date.getSeconds()).padStart(2, "0")

	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 加载仓库列表
const loadRepos = async () => {
	loading.value = true
	try {
		const response = await repoApi.getAllRepos()
		repos.value = response.data || []
	} catch (error) {
		ElMessage.error("加载仓库列表失败")
		console.error(error)
	} finally {
		loading.value = false
	}
}

// 删除仓库
const handleDelete = async (repo) => {
	try {
		// 先弹出确认对话框
		await ElMessageBox.confirm(
			`确定要删除仓库 "${repo.repoName}" 吗？此操作将删除仓库的所有数据，不可恢复。`,
			"确认删除",
			{
				confirmButtonText: "继续",
				cancelButtonText: "取消",
				type: "warning",
			}
		)

		// 弹出密码输入框
		const { value: password } = await ElMessageBox.prompt(
			"请输入您的管理员密码以确认删除操作",
			"验证密码",
			{
				confirmButtonText: "确定删除",
				cancelButtonText: "取消",
				inputType: "password",
				inputPlaceholder: "请输入密码",
				inputValidator: (value) => {
					if (!value) {
						return "密码不能为空"
					}
					return true
				},
			}
		)

		// 调用删除接口，传入密码
		const response = await repoApi.deleteRepo(repo.repoName, password)
		if (response.code === 200) {
			ElMessage.success("仓库删除成功")
			loadRepos()
		} else {
			ElMessage.error(response.msg || "删除失败")
		}
	} catch (error) {
		// 用户取消操作
		if (error === "cancel" || error === "close") {
			return
		}
		// API 错误
		if (error.response?.data?.msg) {
			ElMessage.error(error.response.data.msg)
		} else if (error.message) {
			ElMessage.error(error.message)
		} else {
			ElMessage.error("删除失败")
		}
		console.error(error)
	}
}

onMounted(() => {
	// 获取当前用户信息
	const userInfo = authUtils.getCurrentUser()
	currentUser.value = userInfo
	loadRepos()
})
</script>

<style scoped>
.repo-management {
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
	.repo-management {
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

	.card-header .el-input {
		width: 100% !important;
	}
}
</style>
