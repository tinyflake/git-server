<template>
	<div class="repo-detail">
		<!-- 顶部导航栏 -->
		<RepoHeader
			:repo-name="repoName"
			@show-guide="showGuideDialog = true"
		/>

		<!-- 主要内容区域 -->
		<main class="main-content" v-loading="loading">
			<div class="content-container">
				<div
					class="content-layout"
					:class="{ 'full-width': !showSidebar }"
				>
					<!-- 左侧主要内容 -->
					<div class="main-section">
						<div v-if="repoInfo" class="package-content">
							<!-- 包描述 -->
							<div class="package-description-section">
								<p class="package-description">
									{{ repoInfo.desc || "暂无描述" }}
								</p>
							</div>

							<!-- 标签页内容 -->
							<div class="package-tabs">
								<el-tabs
									v-model="activeTab"
									class="detail-tabs"
								>
									<el-tab-pane label="README" name="readme">
										<div class="tab-content">
											<ReadmeTab
												:readme-loading="readmeLoading"
												:readme-content="readmeContent"
												:rendered-readme="
													renderedReadme
												"
												:readme-headings="
													readmeHeadings
												"
												:show-toc="showToc"
												:repo-name="repoName"
												:scroll-to-heading="
													scrollToHeading
												"
											/>
										</div>
									</el-tab-pane>

									<el-tab-pane label="版本" name="versions">
										<div class="tab-content">
											<VersionsTab
												:versions-loading="
													versionsLoading
												"
												:versions="versions"
												:current-version="
													currentVersion
												"
												:switch-to-version="
													handleSwitchToVersion
												"
												:format-date="formatDate"
											/>
										</div>
									</el-tab-pane>

									<el-tab-pane
										label="依赖"
										name="dependencies"
									>
										<div class="tab-content">
											<DependenciesTab
												:package-loading="
													packageLoading
												"
												:package-error="packageError"
												:dependencies="dependencies"
												:dev-dependencies="
													devDependencies
												"
												:peer-dependencies="
													peerDependencies
												"
												:optional-dependencies="
													optionalDependencies
												"
												:has-dependencies="
													hasDependencies
												"
												:dependency-stats="
													dependencyStats
												"
											/>
										</div>
									</el-tab-pane>

									<el-tab-pane label="文件" name="files">
										<div class="tab-content">
											<FilesTab
												:has-code-view-permission="
													hasCodeViewPermission
												"
												:contact-admin="contactAdmin"
												:files-loading="filesLoading"
												:branches="branches"
												v-model:current-branch="
													currentBranch
												"
												v-model:file-search="fileSearch"
												:file-tree-data="fileTreeData"
												:file-tree-props="fileTreeProps"
												:load-node="loadNode"
												:handle-file-click="
													handleFileClick
												"
												:filter-file-node="
													filterFileNode
												"
												:file-tree-ref="fileTreeRef"
												:selected-file="selectedFile"
												:file-content-loading="
													fileContentLoading
												"
												:file-content="fileContent"
												:highlighted-code="
													highlightedCode
												"
												:format-file-size="
													formatFileSize
												"
												:handle-branch-change="
													handleBranchChange
												"
												:copy-file-content="
													copyFileContent
												"
												:download-current-file="
													downloadCurrentFile
												"
											/>
										</div>
									</el-tab-pane>

									<el-tab-pane
										label="提交历史"
										name="commits"
									>
										<div class="tab-content">
											<CommitsTab
												:commits-loading="
													commitsLoading
												"
												:commits="commits"
												v-model:commits-branch="
													commitsBranch
												"
												:branches="branches"
												:has-more-commits="
													hasMoreCommits
												"
												:loading-more="loadingMore"
												:load-commits="loadCommits"
												:load-more-commits="
													loadMoreCommits
												"
												:format-date="formatDate"
											/>
										</div>
									</el-tab-pane>
								</el-tabs>
							</div>
						</div>

						<!-- 加载状态 -->
						<div v-else-if="!loading" class="error-state">
							<el-result
								icon="warning"
								title="包不存在"
								sub-title="请检查包名称是否正确"
							>
								<template #extra>
									<el-button type="primary" @click="goBack"
										>返回首页</el-button
									>
								</template>
							</el-result>
						</div>
					</div>

					<!-- 右侧信息面板 -->
					<GitRepoSidebar
						v-if="repoInfo && showSidebar"
						:repo-info="repoInfo"
						:git-url="gitUrl"
						:repo-name="repoName"
						:display-version-info="displayVersionInfo"
						:format-date="formatDate"
					/>
				</div>
			</div>
		</main>

		<!-- 操作指南对话框 -->
		<el-dialog
			v-model="showGuideDialog"
			title="📖 Git 操作指南"
			width="600px"
		>
			<div class="guide-content">
				<el-tabs type="border-card">
					<el-tab-pane label="克隆仓库">
						<div class="guide-section">
							<p>使用以下命令克隆仓库到本地：</p>
							<div class="command-box">
								<span class="code-text"
									>git clone {{ gitUrl }}</span
								>
								<el-button
									size="small"
									@click="
										copyToClipboard(`git clone ${gitUrl}`)
									"
									:icon="CopyDocument"
								/>
							</div>
						</div>
					</el-tab-pane>

					<el-tab-pane label="推送代码">
						<div class="guide-section">
							<p>将本地代码推送到此仓库：</p>
							<div class="command-step">
								<div class="step-number">1</div>
								<div class="step-content">
									<p>添加远程仓库：</p>
									<div class="command-box">
										<span class="code-text"
											>git remote add origin
											{{ gitUrl }}</span
										>
										<el-button
											size="small"
											@click="
												copyToClipboard(
													`git remote add origin ${gitUrl}`,
												)
											"
											:icon="CopyDocument"
										/>
									</div>
								</div>
							</div>

							<div class="command-step">
								<div class="step-number">2</div>
								<div class="step-content">
									<p>推送代码：</p>
									<div class="command-box">
										<span class="code-text"
											>git push -u origin main</span
										>
										<el-button
											size="small"
											@click="
												copyToClipboard(
													'git push -u origin main',
												)
											"
											:icon="CopyDocument"
										/>
									</div>
								</div>
							</div>
						</div>
					</el-tab-pane>
				</el-tabs>
			</div>

			<template #footer>
				<el-button type="primary" @click="showGuideDialog = false">
					知道了
				</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import { CopyDocument } from "@element-plus/icons-vue"
import configManager from "../utils/config"
import "highlight.js/styles/github.css"

// 导入组件
import RepoHeader from "../components/repo/RepoHeader.vue"
import ReadmeTab from "../components/repo/ReadmeTab.vue"
import VersionsTab from "../components/repo/VersionsTab.vue"
import FilesTab from "../components/repo/FilesTab.vue"
import CommitsTab from "../components/repo/CommitsTab.vue"
import DependenciesTab from "../components/repo/DependenciesTab.vue"
import GitRepoSidebar from "../components/repo/GitRepoSidebar.vue"

// 导入composables
import { useRepoInfo } from "../composables/useRepoInfo.js"
import { useCodePermission } from "../composables/useCodePermission.js"
import { useReadme } from "../composables/useReadme.js"
import { useVersions } from "../composables/useVersions.js"
import { useFileBrowser } from "../composables/useFileBrowser.js"
import { useCommits } from "../composables/useCommits.js"
import { usePackageInfo } from "../composables/usePackageInfo.js"

const props = defineProps({
	name: {
		type: String,
		required: true,
	},
})

const router = useRouter()

// 基础数据
const repoName = ref(props.name)
const activeTab = ref("readme")
const showGuideDialog = ref(false)
const currentBranch = ref("main")
const hasCheckedFilePermission = ref(false) // 添加标记，避免重复检查

// 使用composables
const { repoInfo, loading, loadRepoInfo } = useRepoInfo(repoName)
const { hasCodeViewPermission, checkCodeViewPermission, contactAdmin } =
	useCodePermission()
const {
	readmeLoading,
	readmeContent,
	renderedReadme,
	readmeHeadings,
	showToc,
	loadReadmeContent,
	scrollToHeading,
} = useReadme(repoInfo)
const {
	versions,
	versionsLoading,
	currentVersion,
	loadVersions,
	switchToVersion,
} = useVersions(repoInfo)
const {
	filesLoading,
	branches,
	fileTreeData,
	fileTreeRef,
	fileSearch,
	selectedFile,
	fileContent,
	fileContentLoading,
	highlightedCode,
	fileTreeProps,
	loadBranches,
	loadNode,
	handleFileClick,
	formatFileSize,
	filterFileNode,
	handleBranchChange,
	copyFileContent,
	downloadCurrentFile,
} = useFileBrowser(repoInfo, currentBranch, hasCodeViewPermission)
const {
	commitsLoading,
	commits,
	commitsBranch,
	hasMoreCommits,
	loadingMore,
	loadCommits,
	loadMoreCommits,
} = useCommits(repoInfo)
const {
	packageInfo,
	packageLoading,
	packageError,
	dependencies,
	devDependencies,
	peerDependencies,
	optionalDependencies,
	hasDependencies,
	dependencyStats,
	loadPackageInfo,
} = usePackageInfo(repoInfo)

// 计算属性
const gitUrl = computed(() => {
	if (!repoInfo.value) return ""
	return configManager.getGitUrl(repoInfo.value.repoName)
})

const showSidebar = computed(() => {
	return activeTab.value !== "files"
})

const displayVersionInfo = computed(() => {
	if (currentVersion.value) {
		return {
			version: currentVersion.value.version,
			author: currentVersion.value.author,
			email: currentVersion.value.email,
			date: currentVersion.value.date,
			message: currentVersion.value.message,
			hash: currentVersion.value.hash,
			shortHash: currentVersion.value.shortHash,
			isLatest: currentVersion.value.isLatest,
		}
	}

	if (repoInfo.value) {
		return {
			version: repoInfo.value.version,
			author: repoInfo.value.author,
			email: repoInfo.value.authorEmail,
			date: repoInfo.value.lastModified,
			message: repoInfo.value.lastCommitMessage,
			hash: repoInfo.value.lastCommitHash,
			shortHash: repoInfo.value.lastCommitHash?.substring(0, 7),
			isLatest: true,
		}
	}

	return null
})

// 方法
const goBack = () => {
	router.push("/")
}

const formatDate = (dateString) => {
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

const copyToClipboard = async (text) => {
	try {
		await navigator.clipboard.writeText(text)
		ElMessage.success("已复制到剪贴板")
	} catch (error) {
		const textArea = document.createElement("textarea")
		textArea.value = text
		document.body.appendChild(textArea)
		textArea.select()
		try {
			document.execCommand("copy")
		} catch (execError) {
			console.error("复制失败:", execError)
		}
		document.body.removeChild(textArea)
		ElMessage.success("已复制到剪贴板")
	}
}

const handleSwitchToVersion = async (version) => {
	activeTab.value = "readme"
	await switchToVersion(
		version,
		readmeContent,
		renderedReadme,
		readmeHeadings,
		showToc,
		readmeLoading,
	)
}

// 生命周期
onMounted(() => {
	loadRepoInfo()
})

// 监听repoInfo变化，加载package信息
watch(
	repoInfo,
	(newRepoInfo) => {
		if (newRepoInfo) {
			loadPackageInfo()
		}
	},
	{ immediate: true },
)

// 监听器
watch(
	repoInfo,
	(newRepoInfo) => {
		if (newRepoInfo) {
			loadReadmeContent()
			loadVersions()
		}
	},
	{ immediate: true },
)

watch(activeTab, async (newTab) => {
	if (newTab === "commits" && commits.value.length === 0 && repoInfo.value) {
		loadCommits(true)
	}
	if (newTab === "files" && repoInfo.value) {
		// 只在第一次进入文件标签页时检查权限
		if (!hasCheckedFilePermission.value) {
			hasCheckedFilePermission.value = true
			await checkCodeViewPermission(repoInfo.value.repoPath)
			// 只有有权限时才加载分支
			if (hasCodeViewPermission.value) {
				loadBranches()
			}
		}
	}
})
</script>

<style scoped>
/* 全局样式 */
.repo-detail {
	min-height: 100vh;
	background: #fafafa;
	font-family:
		-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* 主要内容区域 */
.main-content {
	flex: 1;
}

.content-container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 32px 24px;
}

.content-layout {
	display: grid;
	grid-template-columns: 1fr 300px;
	gap: 32px;
	align-items: start;
	transition: grid-template-columns 0.3s ease;
}

.content-layout.full-width {
	grid-template-columns: 1fr;
}

/* 左侧主要内容 */
.main-section {
	background: white;
	border-radius: 8px;
	border: 1px solid #e5e7eb;
	overflow: hidden;
}

.package-content {
	padding: 0;
}

.package-description-section {
	padding: 24px;
	border-bottom: 1px solid #f3f4f6;
}

.package-description {
	margin: 0;
	font-size: 16px;
	color: #6b7280;
	line-height: 1.6;
}

/* 标签页 */
.package-tabs {
	padding: 0;
}

.detail-tabs :deep(.el-tabs__header) {
	margin: 0;
	padding: 0 24px;
	background: #f9fafb;
	border-bottom: 1px solid #e5e7eb;
}

.detail-tabs :deep(.el-tabs__nav-wrap) {
	padding: 0;
}

.detail-tabs :deep(.el-tabs__item) {
	padding: 16px 20px;
	font-weight: 500;
}

.detail-tabs :deep(.el-tabs__content) {
	padding: 0;
}

.tab-content {
	padding: 32px 24px;
}

/* 错误状态 */
.error-state {
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 400px;
	background: white;
	border-radius: 8px;
	border: 1px solid #e5e7eb;
}

/* 操作指南对话框 */
.guide-content {
	padding: 10px 0;
}

.guide-section {
	padding: 16px;
}

.guide-section p {
	margin: 0 0 16px 0;
	color: #6b7280;
	font-size: 14px;
}

.command-step {
	display: flex;
	margin-bottom: 20px;
	align-items: flex-start;
}

.step-number {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	background-color: #409eff;
	color: white;
	border-radius: 50%;
	font-size: 12px;
	font-weight: bold;
	flex-shrink: 0;
	margin-top: 2px;
}

.step-content {
	flex: 1;
}

.step-content p {
	margin: 0 0 8px 0;
	font-size: 14px;
	color: #6b7280;
}

.command-box {
	display: flex;
	align-items: center;
	padding: 8px 12px;
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	font-family:
		"JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", "Monaco",
		monospace;
	min-height: 36px;
}

.command-box .code-text {
	flex: 1;
	background: none;
	border: none;
	font-size: 12px;
	color: #111827;
	word-break: break-all;
	line-height: 1.4;
}

.command-box .el-button {
	margin-left: 8px;
	flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
	.content-layout {
		grid-template-columns: 1fr;
		gap: 24px;
	}
}

@media (max-width: 768px) {
	.content-container {
		padding: 24px 16px;
	}

	.tab-content {
		padding: 24px 16px;
	}

	.package-description-section {
		padding: 20px 16px;
	}
}
</style>
