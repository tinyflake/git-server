<template>
	<div class="home">
		<!-- 主要内容区域 -->
		<div class="content-container">
			<!-- 搜索栏 -->
			<div class="search-section">
				<div class="search-wrapper">
					<el-input
						v-model="searchQuery"
						placeholder="搜索包..."
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

			<!-- 包列表 -->
			<div class="packages-section">
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

				<!-- 包卡片列表 -->
				<div v-else class="packages-list">
					<PackageCard
						v-for="repo in filteredRepoList"
						:key="repo.repoName"
						:repo="repo"
						@click="goToRepo(repo.repoName)"
						@copy-install="copyInstallCommand"
						@download-latest="downloadLatestVersion"
						@edit-path="editRepoPath"
						@show-guide="handleShowGuide"
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
						v-else-if="!loading && repoList.length === 0"
						class="empty-state"
					>
						<div class="empty-content">
							<el-icon class="empty-icon"><Box /></el-icon>
							<p>暂无包</p>
							<p class="empty-hint">请联系管理员创建仓库</p>
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
import { ref, onMounted, computed } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import { Search, Box } from "@element-plus/icons-vue"
import { authUtils } from "../api/auth.js"
import configManager from "../utils/config"
import PackageCard from "../components/PackageCard.vue"
import EditRepoPathDialog from "../components/EditRepoPathDialog.vue"
import RepoGuideDialog from "../components/RepoGuideDialog.vue"
import { useRepoList } from "../composables/useRepoList.js"
import { useRepoOperations } from "../composables/useRepoOperations.js"

const router = useRouter()

// 搜索
const searchQuery = ref("")

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

// 计算属性
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
			repo.repoPath.toLowerCase().includes(query)
	)
})

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

	loadRepoList()
	await loadConfig()
})
</script>

<style scoped>
/* 全局样式 */
.home {
	background: #fafafa;
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
		sans-serif;
}

.content-container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 32px 24px;
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
