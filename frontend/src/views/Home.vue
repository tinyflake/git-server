<template>
	<div class="home" :class="`mode-${currentMode}`">
		<!-- 主要内容区域 -->
		<div class="content-container">
			<!-- 模式切换栏 -->
			<div class="mode-section">
				<div class="mode-switcher">
					<el-button-group>
						<el-button
							:type="
								currentMode === 'git' ? 'primary' : 'default'
							"
							@click="switchMode('git')"
							class="mode-button"
						>
							<el-icon><FolderOpened /></el-icon>
							私有仓库
						</el-button>
						<el-button
							:type="
								currentMode === 'npm' ? 'primary' : 'default'
							"
							@click="switchMode('npm')"
							class="mode-button"
						>
							<el-icon><Box /></el-icon>
							私有NPM
						</el-button>
					</el-button-group>
				</div>
			</div>

			<!-- 搜索栏 -->
			<div class="search-section">
				<div class="search-wrapper">
					<el-input
						v-model="searchQuery"
						:placeholder="
							currentMode === 'git' ? '搜索仓库...' : '搜索包...'
						"
						size="large"
						clearable
						class="search-input"
					>
						<template #prefix>
							<el-icon><Search /></el-icon>
						</template>
					</el-input>
				</div>
			</div>

			<!-- Git 仓库列表 -->
			<div v-if="currentMode === 'git'" class="packages-section">
				<!-- 加载状态 -->
				<div v-if="loading" class="packages-loading">
					<div v-for="n in 8" :key="n" class="package-skeleton">
						<div class="skeleton-header">
							<div class="skeleton-title"></div>
							<div class="skeleton-version"></div>
						</div>
						<div class="skeleton-desc"></div>
						<div class="skeleton-meta">
							<div class="skeleton-meta-item"></div>
							<div class="skeleton-meta-item"></div>
							<div class="skeleton-meta-item"></div>
						</div>
					</div>
				</div>

				<!-- 仓库卡片列表 -->
				<div v-else class="packages-list">
					<PackageCard
						v-for="repo in filteredRepoList"
						:key="repo.repoName"
						:repo="repo"
						:current-user="currentUser"
						@click="goToRepo(repo.repoName)"
						@copy-install="copyInstallCommand"
						@download-latest="downloadLatestVersion"
						@edit-path="editRepoPath"
						@show-guide="handleShowGuide"
						@delete="handleDeleteRepo"
					/>

					<!-- 空状态 -->
					<div
						v-if="
							!loading &&
							filteredRepoList.length === 0 &&
							searchQuery
						"
						class="empty-state"
					>
						<div class="empty-content">
							<el-icon class="empty-icon"><Search /></el-icon>
							<p>未找到匹配 "{{ searchQuery }}" 的仓库</p>
							<el-button
								@click="searchQuery = ''"
								type="primary"
								plain
							>
								清除搜索
							</el-button>
						</div>
					</div>

					<div
						v-else-if="!loading && repoList.length === 0"
						class="empty-state"
					>
						<div class="empty-content">
							<el-icon class="empty-icon"
								><FolderOpened
							/></el-icon>
							<p>暂无仓库</p>
							<p class="empty-hint">请联系管理员创建仓库</p>
						</div>
					</div>
				</div>
			</div>

			<!-- NPM 包列表 -->
			<div v-if="currentMode === 'npm'" class="packages-section">
				<!-- NPM 服务状态提示 -->
				<div v-if="!npmServiceRunning" class="npm-status-warning">
					<el-alert
						title="NPM 服务未运行"
						description="请先启动 Verdaccio 服务：npm run verdaccio:start"
						type="warning"
						:closable="false"
						show-icon
					/>
				</div>

				<!-- 加载状态 -->
				<div v-if="loading" class="packages-loading">
					<div v-for="n in 8" :key="n" class="package-skeleton">
						<div class="skeleton-header">
							<div class="skeleton-title"></div>
							<div class="skeleton-version"></div>
						</div>
						<div class="skeleton-desc"></div>
						<div class="skeleton-meta">
							<div class="skeleton-meta-item"></div>
							<div class="skeleton-meta-item"></div>
							<div class="skeleton-meta-item"></div>
						</div>
					</div>
				</div>

				<!-- NPM 包卡片列表 -->
				<div v-else class="packages-list">
					<PackageCard
						v-for="pkg in filteredPackageList"
						:key="pkg.name"
						:repo="transformPackageToRepo(pkg)"
						:current-user="currentUser"
						@click="viewPackageDetail(pkg)"
						@copy-install="copyNpmInstallCommand"
						@download-latest="downloadNpmPackage"
						@edit-path="editPackagePath"
						@show-guide="showPackageGuide"
					/>

					<!-- 空状态 -->
					<div
						v-if="
							!loading &&
							filteredPackageList.length === 0 &&
							searchQuery
						"
						class="empty-state"
					>
						<div class="empty-content">
							<el-icon class="empty-icon"><Search /></el-icon>
							<p>未找到匹配 "{{ searchQuery }}" 的包</p>
							<el-button
								@click="searchQuery = ''"
								type="primary"
								plain
							>
								清除搜索
							</el-button>
						</div>
					</div>

					<div
						v-else-if="!loading && packageList.length === 0"
						class="empty-state"
					>
						<div class="empty-content">
							<el-icon class="empty-icon"><Box /></el-icon>
							<p>暂无包</p>
							<p class="empty-hint">请发布 NPM 包到私服</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- 修改路径对话框 -->
		<EditRepoPathDialog
			v-model="showEditDialog"
			:loading="editLoading"
			:repo-data="editForm"
			@submit="handleUpdatePath"
		/>

		<!-- 绑定操作提示对话框 -->
		<RepoGuideDialog v-model="showBindDialog" :repo-info="newRepoInfo" />
	</div>
</template>

<script setup>
import { ref, onMounted, computed, inject } from "vue"
import { useRouter } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import { Search, Box, FolderOpened } from "@element-plus/icons-vue"
import { authUtils } from "../api/auth.js"
import { repoApi } from "../api/repo.js"
import configManager from "../utils/config"
import PackageCard from "../components/PackageCard.vue"
import EditRepoPathDialog from "../components/EditRepoPathDialog.vue"
import RepoGuideDialog from "../components/RepoGuideDialog.vue"
import { useRepoList } from "../composables/useRepoList.js"
import { useRepoOperations } from "../composables/useRepoOperations.js"

const router = useRouter()

const currentMode = inject("currentMode", ref("git"))
// 搜索
const searchQuery = ref("")

// 当前用户
const currentUser = ref(null)

// NPM 相关状态
const packageList = ref([])
const npmServiceRunning = ref(false)

// 配置
const configForm = ref({
	...configManager.getDisplayConfig(),
})

// 对话框状态
const showEditDialog = ref(false)
const showBindDialog = ref(false)

// 编辑表单
const editForm = ref({
	repoName: "",
	newPath: "",
})

// 使用组合式函数
const { repoList, loading, loadRepoList } = useRepoList()
const {
	editLoading,
	newRepoInfo,
	handleUpdatePath: updatePath,
	showRepoGuide,
	copyInstallCommand,
	downloadLatestVersion,
} = useRepoOperations(configForm, loadRepoList)

// 计算属性 - Git 仓库列表
const filteredRepoList = computed(() => {
	if (!Array.isArray(repoList.value)) {
		return []
	}
	if (!searchQuery.value) {
		return repoList.value
	}

	const query = searchQuery.value.toLowerCase()
	return repoList.value.filter(
		(repo) =>
			repo.repoName.toLowerCase().includes(query) ||
			repo.desc.toLowerCase().includes(query) ||
			repo.repoPath.toLowerCase().includes(query),
	)
})

// 计算属性 - NPM 包列表
const filteredPackageList = computed(() => {
	if (!Array.isArray(packageList.value)) {
		return []
	}
	if (!searchQuery.value) {
		return packageList.value
	}

	const query = searchQuery.value.toLowerCase()
	return packageList.value.filter(
		(pkg) =>
			pkg.name.toLowerCase().includes(query) ||
			(pkg.description && pkg.description.toLowerCase().includes(query)),
	)
})

// 切换模式
const switchMode = (mode) => {
	currentMode.value = mode
	searchQuery.value = "" // 清空搜索

	// 通知父组件（Layout）更新Header样式
	if (window.updateHeaderMode) {
		window.updateHeaderMode(mode)
	}

	loadData()
}

// 根据当前模式加载数据
const loadData = () => {
	if (currentMode.value === "git") {
		loadRepoList()
	} else {
		loadPackageList()
	}
}

// 加载 NPM 包列表
const loadPackageList = async () => {
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
			packageList.value = data.data || []
			console.log("✅ 成功加载包列表，包数量:", packageList.value.length)
		} else {
			ElMessage.error(data.msg || "加载包列表失败")
			packageList.value = []
		}
	} catch (error) {
		console.error("❌ 加载包列表失败:", error)
		ElMessage.error("加载包列表失败")
		packageList.value = []
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

		console.log("📡 状态检查响应:", response.status)

		const data = await response.json()

		console.log("📊 状态数据:", data)

		npmServiceRunning.value =
			data.code === 200 && data.data.status === "running"

		console.log("✅ NPM 服务运行状态:", npmServiceRunning.value)
	} catch (error) {
		console.error("❌ 检查 NPM 服务状态失败:", error)
		npmServiceRunning.value = false
	}
}

// 将 NPM 包数据转换为仓库格式，以便使用 PackageCard 组件
const transformPackageToRepo = (pkg) => {
	return {
		repoName: pkg.name,
		desc: pkg.description || "暂无描述",
		version: pkg.version,
		author: pkg.author || "未知",
		lastModified: pkg.publishTime || new Date().toISOString(),
		creator: pkg.author || "未知",
		license: pkg.license || "MIT",
		keywords: pkg.keywords || [],
		repoPath: `/npm/${pkg.name}`, // NPM 包的虚拟路径
	}
}

// NPM包详情查看 - 跳转到详情页
const viewPackageDetail = (pkg) => {
	router.push(`/npm/${pkg.name}`)
}

// 复制NPM安装命令
const copyNpmInstallCommand = async (repo) => {
	const command = `npm install ${repo.repoName}`
	try {
		await navigator.clipboard.writeText(command)
		ElMessage.success("安装命令已复制到剪贴板")
	} catch (error) {
		// 降级方案
		const textArea = document.createElement("textarea")
		textArea.value = command
		document.body.appendChild(textArea)
		textArea.select()
		document.execCommand("copy")
		document.body.removeChild(textArea)
		ElMessage.success("安装命令已复制到剪贴板")
	}
}

// 下载NPM包
const downloadNpmPackage = (repo) => {
	ElMessage.info(`正在准备下载 ${repo.repoName}...`)
	// 这里可以实现下载NPM包的逻辑
	// 比如生成下载链接或调用API
}

// 编辑包路径（对于NPM包，这个功能可能不适用，但为了保持一致性）
const editPackagePath = (repo) => {
	ElMessage.info("NPM包路径由注册表管理，无需手动编辑")
}

// 显示包指南
const showPackageGuide = (repo) => {
	ElMessageBox.alert(
		`
		<div style="text-align: left;">
			<h4>NPM包使用指南</h4>
			<p><strong>安装命令:</strong></p>
			<span class="code-text" style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px; display: block; margin: 8px 0;">npm install ${repo.repoName}</span>
			<p><strong>使用方法:</strong></p>
			<span class="code-text" style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px; display: block; margin: 8px 0;">
const ${repo.repoName.replace(/[^a-zA-Z0-9]/g, "")} = require('${repo.repoName}')
			</span>
			<p><strong>版本信息:</strong> ${repo.version}</p>
			<p><strong>许可证:</strong> ${repo.license}</p>
		</div>
		`,
		"使用指南",
		{
			dangerouslyUseHTMLString: true,
			confirmButtonText: "关闭",
		},
	)
}

// 查看包详情（保留原有的简单版本）
const viewPackage = (pkg) => {
	ElMessageBox.alert(
		`
		<div style="text-align: left;">
			<p><strong>包名:</strong> ${pkg.name}</p>
			<p><strong>版本:</strong> ${pkg.version}</p>
			<p><strong>描述:</strong> ${pkg.description || "无"}</p>
			<p><strong>作者:</strong> ${pkg.author || "未知"}</p>
			<p><strong>许可证:</strong> ${pkg.license}</p>
			<p><strong>发布时间:</strong> ${formatTime(pkg.publishTime)}</p>
			<p><strong>安装命令:</strong></p>
			<span class="code-text" style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px;">npm install ${pkg.name}</span>
		</div>
		`,
		"包详情",
		{
			dangerouslyUseHTMLString: true,
			confirmButtonText: "关闭",
		},
	)
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
			loadPackageList()
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

	return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 跳转到仓库详情页
const goToRepo = (repoName) => {
	router.push(`/repo/${repoName}`)
}

// 编辑仓库路径
const editRepoPath = (repo) => {
	editForm.value = {
		repoName: repo.repoName,
		newPath: repo.repoPath,
	}
	showEditDialog.value = true
}

// 显示仓库操作指南
const handleShowGuide = (repo) => {
	newRepoInfo.value = showRepoGuide(repo)
	showBindDialog.value = true
}

// 更新仓库路径
const handleUpdatePath = async (formData) => {
	const success = await updatePath(formData)
	if (success) {
		showEditDialog.value = false
	}
}

// 删除仓库
const handleDeleteRepo = async (repo) => {
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
			"请输入您的密码以确认删除操作",
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
			loadRepoList()
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

// 加载配置
const loadConfig = async () => {
	await configManager.fetchServerConfig()
	configForm.value = { ...configManager.getDisplayConfig() }

	const savedConfig = localStorage.getItem("gitServerConfig")
	if (savedConfig) {
		configForm.value = { ...configForm.value, ...JSON.parse(savedConfig) }
	}
}
// 组件挂载时加载数据
onMounted(async () => {
	if (!authUtils.isLoggedIn()) {
		router.push("/login")
		return
	}

	// 获取当前用户信息
	const userInfo = authUtils.getCurrentUser()
	currentUser.value = userInfo

	// 通知Layout当前模式（初始化时）
	if (window.updateHeaderMode) {
		window.updateHeaderMode(currentMode.value)
	}

	loadData()
	await loadConfig()
})
</script>

<style scoped>
/* 全局样式 */
.home {
	background: #fafafa;
	font-family:
		-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	transition: all 0.3s ease;
}

/* Git 模式样式（默认） */
.mode-git {
	--primary-bg: #fafafa;
	--card-bg: #ffffff;
	--accent-color: #409eff;
	--border-color: #e5e7eb;
}

/* NPM 模式样式（绿色主题） */
.mode-npm {
	--primary-bg: #f0f9f0;
	--card-bg: #fafffe;
	--accent-color: #67c23a;
	--border-color: #c2e7b0;
}

.mode-npm {
	background: var(--primary-bg);
}

.mode-npm .packages-section {
	background: var(--card-bg);
	border-color: var(--border-color);
}

.mode-npm .search-input :deep(.el-input__wrapper:hover) {
	border-color: var(--accent-color);
}

.mode-npm .search-input :deep(.el-input__wrapper.is-focus) {
	border-color: var(--accent-color);
	box-shadow: 0 0 0 3px rgba(103, 194, 58, 0.1);
}

.content-container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 32px 24px;
}

/* 模式切换区域 */
.mode-section {
	margin-bottom: 24px;
	display: flex;
	justify-content: center;
}

.mode-switcher {
	display: flex;
	justify-content: center;
}

.mode-button {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
}

/* 搜索栏 */
.search-section {
	margin-bottom: 32px;
}

.search-wrapper {
	max-width: 600px;
	margin: 0 auto;
}

.search-input {
	width: 100%;
}

.search-input :deep(.el-input__wrapper) {
	border-radius: 8px;
	border: 1px solid #d1d5db;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	padding: 12px 16px;
}

.search-input :deep(.el-input__wrapper:hover) {
	border-color: #10b981;
}

.search-input :deep(.el-input__wrapper.is-focus) {
	border-color: #10b981;
	box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.search-input :deep(.el-input__inner) {
	font-size: 16px;
}

/* 包列表区域 */
.packages-section {
	background: white;
	border-radius: 8px;
	border: 1px solid #e5e7eb;
	overflow: hidden;
}

/* 加载状态 */
.packages-loading {
	padding: 0;
}

.package-skeleton {
	padding: 20px 24px;
	border-bottom: 1px solid #f3f4f6;
}

.package-skeleton:last-child {
	border-bottom: none;
}

.skeleton-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
}

.skeleton-title {
	height: 20px;
	width: 200px;
	background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
	background-size: 200% 100%;
	animation: skeleton-loading 1.5s infinite;
	border-radius: 4px;
}

.skeleton-version {
	height: 18px;
	width: 60px;
	background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
	background-size: 200% 100%;
	animation: skeleton-loading 1.5s infinite;
	border-radius: 4px;
}

.skeleton-desc {
	height: 16px;
	width: 80%;
	background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
	background-size: 200% 100%;
	animation: skeleton-loading 1.5s infinite;
	border-radius: 4px;
	margin-bottom: 12px;
}

.skeleton-meta {
	display: flex;
	gap: 24px;
}

.skeleton-meta-item {
	height: 14px;
	width: 80px;
	background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
	background-size: 200% 100%;
	animation: skeleton-loading 1.5s infinite;
	border-radius: 4px;
}

@keyframes skeleton-loading {
	0% {
		background-position: 200% 0;
	}
	100% {
		background-position: -200% 0;
	}
}

/* 包列表 */
.packages-list {
	padding: 0;
}

/* NPM 状态警告 */
.npm-status-warning {
	padding: 16px;
	border-bottom: 1px solid #f3f4f6;
}

/* 空状态 */
.empty-state {
	padding: 80px 24px;
	text-align: center;
}

.empty-content {
	max-width: 400px;
	margin: 0 auto;
}

.empty-icon {
	font-size: 48px;
	color: #d1d5db;
	margin-bottom: 16px;
}

.empty-content p {
	margin: 0 0 24px 0;
	color: #6b7280;
	font-size: 16px;
}

.empty-hint {
	margin: 8px 0 0 0 !important;
	font-size: 14px !important;
	color: #9ca3af !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
	.content-container {
		padding: 24px 16px;
	}
}
</style>
