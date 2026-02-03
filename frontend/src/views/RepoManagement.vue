<template>
	<div class="repo-management" :class="`mode-${currentMode}`">
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

						<!-- 模式切换按钮 -->
						<div class="mode-switcher">
							<el-button-group>
								<el-button
									:type="
										currentMode === 'git'
											? 'primary'
											: 'default'
									"
									@click="switchMode('git')"
									class="mode-button"
								>
									<el-icon><FolderOpened /></el-icon>
									私有仓库
								</el-button>
								<el-button
									:type="
										currentMode === 'npm'
											? 'primary'
											: 'default'
									"
									@click="switchMode('npm')"
									class="mode-button"
								>
									<el-icon><Box /></el-icon>
									私有NPM
								</el-button>
							</el-button-group>
						</div>

						<div class="header-title">
							<h2>
								{{
									currentMode === "git"
										? "仓库管理"
										: "NPM 包管理"
								}}
							</h2>
							<p class="header-desc">
								{{
									currentMode === "git"
										? "查看和管理所有 Git 仓库"
										: "查看和管理所有 NPM 包"
								}}
							</p>
						</div>
					</div>
					<el-input
						v-model="searchKeyword"
						:placeholder="
							currentMode === 'git'
								? '搜索仓库名称'
								: '搜索包名称'
						"
						style="width: 300px"
						clearable
					>
						<template #prefix>
							<el-icon><Search /></el-icon>
						</template>
					</el-input>
				</div>
			</template>

			<!-- Git 仓库表格 -->
			<el-table
				v-if="currentMode === 'git'"
				:data="filteredRepos"
				v-loading="loading"
			>
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

			<!-- NPM 包表格 -->
			<el-table
				v-if="currentMode === 'npm'"
				:data="filteredPackages"
				v-loading="loading"
			>
				<el-table-column prop="name" label="包名称" width="250">
					<template #default="{ row }">
						<div class="package-name">
							<el-icon class="package-icon"><Box /></el-icon>
							<span>{{ row.name }}</span>
						</div>
					</template>
				</el-table-column>
				<el-table-column
					prop="description"
					label="描述"
					min-width="200"
					show-overflow-tooltip
				/>
				<el-table-column prop="version" label="最新版本" width="120">
					<template #default="{ row }">
						<el-tag type="success" size="small">
							v{{ row.version }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="author" label="作者" width="150" />
				<el-table-column
					prop="publishTime"
					label="发布时间"
					width="180"
				>
					<template #default="{ row }">
						{{ formatTime(row.publishTime) }}
					</template>
				</el-table-column>
				<el-table-column prop="license" label="许可证" width="100">
					<template #default="{ row }">
						<el-tag size="small">{{ row.license }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column
					label="操作"
					width="160"
					fixed="right"
					align="center"
				>
					<template #default="{ row }">
						<!-- <el-button size="small" @click="viewPackage(row)">
							查看
						</el-button> -->
						<el-button
							v-if="canDeletePackage(row)"
							size="small"
							type="danger"
							@click="handleDeletePackage(row)"
						>
							删除
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<!-- NPM 服务状态提示 -->
			<div
				v-if="currentMode === 'npm' && !npmServiceRunning"
				class="npm-status-warning"
			>
				<el-alert
					title="NPM 服务未运行"
					description="请先启动 Verdaccio 服务：npm run verdaccio:start"
					type="warning"
					:closable="false"
					show-icon
				/>
			</div>
		</el-card>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { ArrowLeft, Search, FolderOpened, Box } from "@element-plus/icons-vue"
import { repoApi } from "../api/repo"
import { authUtils } from "../api/auth"

const repos = ref([])
const packages = ref([])
const loading = ref(false)
const searchKeyword = ref("")
const currentUser = ref(null)
const currentMode = ref("git") // 'git' | 'npm'
const npmServiceRunning = ref(false)

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
		repo.repoName.toLowerCase().includes(keyword),
	)
})

// 过滤后的包列表
const filteredPackages = computed(() => {
	if (!Array.isArray(packages.value)) {
		return []
	}
	if (!searchKeyword.value) {
		return packages.value
	}
	const keyword = searchKeyword.value.toLowerCase()
	return packages.value.filter(
		(pkg) =>
			pkg.name.toLowerCase().includes(keyword) ||
			(pkg.description &&
				pkg.description.toLowerCase().includes(keyword)),
	)
})

// 切换模式
const switchMode = (mode) => {
	currentMode.value = mode
	searchKeyword.value = "" // 清空搜索
	loadData()
}

// 根据当前模式加载数据
const loadData = () => {
	if (currentMode.value === "git") {
		loadRepos()
	} else {
		loadPackages()
	}
}

// 判断是否可以删除仓库
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

// 判断是否可以删除包
const canDeletePackage = (pkg) => {
	if (!currentUser.value) return false
	// 超管和管理员都可以删除包
	return (
		currentUser.value.role === "super_admin" ||
		currentUser.value.role === "admin"
	)
}

// 格式化时间
const formatTime = (dateString) => {
	if (!dateString || dateString === "未知") return "未知"
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

// 加载 NPM 包列表
const loadPackages = async () => {
	loading.value = true
	try {
		console.log("🔄 开始加载 NPM 包列表")

		// 先检查 NPM 服务状态
		await checkNpmServiceStatus()

		console.log("📊 NPM 服务状态:", npmServiceRunning.value)

		// 无论服务是否运行，都尝试获取包列表（因为我们可以直接读取文件系统）
		const token = localStorage.getItem("token")
		const response = await fetch("/api/npm/packages", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})

		console.log("📡 API 响应状态:", response.status)

		const data = await response.json()

		console.log("📦 API 响应数据:", data)

		if (data.code === 200) {
			packages.value = data.data || []
			console.log("✅ 成功加载", packages.value.length, "个包")
		} else {
			ElMessage.error(data.msg || "加载包列表失败")
			packages.value = []
			console.error("❌ 加载包列表失败:", data.msg)
		}
	} catch (error) {
		ElMessage.error("加载包列表失败")
		console.error("❌ 加载包列表异常:", error)
		packages.value = []
	} finally {
		loading.value = false
	}
}

// 检查 NPM 服务状态
const checkNpmServiceStatus = async () => {
	try {
		console.log("🔍 检查 NPM 服务状态...")
		const token = localStorage.getItem("token")
		const response = await fetch("/api/npm/status", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
		const data = await response.json()
		console.log("📊 NPM 状态 API 响应:", data)
		npmServiceRunning.value =
			data.code === 200 && data.data.status === "running"
		console.log("✅ NPM 服务运行状态:", npmServiceRunning.value)
	} catch (error) {
		console.error("❌ 检查 NPM 服务状态失败:", error)
		npmServiceRunning.value = false
	}
}

// 查看包详情
// const viewPackage = (pkg) => {
// 	ElMessageBox.alert(
// 		`
// 		<div style="text-align: left;">
// 			<p><strong>包名:</strong> ${pkg.name}</p>
// 			<p><strong>版本:</strong> ${pkg.version}</p>
// 			<p><strong>描述:</strong> ${pkg.description || "无"}</p>
// 			<p><strong>作者:</strong> ${pkg.author || "未知"}</p>
// 			<p><strong>许可证:</strong> ${pkg.license}</p>
// 			<p><strong>发布时间:</strong> ${formatTime(pkg.publishTime)}</p>
// 			<p><strong>安装命令:</strong></p>
// 			<span class="code-text" style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px;">npm install ${pkg.name}</span>
// 		</div>
// 		`,
// 		"包详情",
// 		{
// 			dangerouslyUseHTMLString: true,
// 			confirmButtonText: "关闭",
// 		},
// 	)
// }

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
			},
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
			},
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

// 删除包
const handleDeletePackage = async (pkg) => {
	try {
		await ElMessageBox.confirm(
			`确定要删除包 "${pkg.name}" 吗？此操作将删除包的所有版本，不可恢复。`,
			"确认删除",
			{
				confirmButtonText: "确定删除",
				cancelButtonText: "取消",
				type: "warning",
			},
		)

		const token = localStorage.getItem("token")
		const response = await fetch(
			`/api/npm/package/${encodeURIComponent(pkg.name)}`,
			{
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			},
		)

		const data = await response.json()

		if (data.code === 200) {
			ElMessage.success("包删除成功")
			loadPackages()
		} else {
			ElMessage.error(data.msg || "删除失败")
		}
	} catch (error) {
		if (error === "cancel" || error === "close") {
			return
		}
		ElMessage.error("删除失败")
		console.error(error)
	}
}

onMounted(() => {
	// 获取当前用户信息
	const userInfo = authUtils.getCurrentUser()
	currentUser.value = userInfo
	loadData()
})
</script>

<style scoped>
.repo-management {
	max-width: 1400px;
	margin: 0 auto;
	padding: 32px 24px;
	transition: all 0.3s ease;
}

/* Git 模式样式（默认） */
.mode-git {
	--primary-bg: #f5f7fa;
	--card-bg: #ffffff;
	--accent-color: #409eff;
	--border-color: #e4e7ed;
}

/* NPM 模式样式（绿色主题） */
.mode-npm {
	--primary-bg: #f0f9f0;
	--card-bg: #fafffe;
	--accent-color: #67c23a;
	--border-color: #c2e7b0;
}

.mode-npm .el-card {
	background: var(--card-bg);
	border-color: var(--border-color);
}

.mode-npm .card-header {
	background: linear-gradient(135deg, #f0f9f0 0%, #e8f5e8 100%);
	margin: -20px -20px 20px -20px;
	padding: 20px;
	border-radius: 4px 4px 0 0;
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

.mode-switcher {
	flex-shrink: 0;
}

.mode-button {
	display: flex;
	align-items: center;
	gap: 6px;
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

.package-name {
	display: flex;
	align-items: center;
	gap: 8px;
}

.package-icon {
	color: var(--accent-color);
}

.npm-status-warning {
	margin-top: 16px;
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

	.mode-switcher {
		width: 100%;
	}

	.mode-switcher .el-button-group {
		width: 100%;
	}

	.mode-button {
		flex: 1;
		justify-content: center;
	}

	.card-header .el-input {
		width: 100% !important;
	}
}
</style>
