<template>
	<div class="npm-package-detail">
		<!-- 顶部导航栏 -->
		<RepoHeader
			:repo-name="repoName"
			@show-guide="showInstallGuide = true"
		/>

		<!-- 主要内容区域 -->
		<main class="main-content" v-loading="loading">
			<div class="content-container">
				<div class="content-layout">
					<!-- 左侧主要内容 -->
					<div class="main-section">
						<div v-if="packageInfo" class="package-content">
							<!-- 包基本信息 -->
							<div class="package-info-section">
								<div class="package-title">
									<h1>{{ packageInfo.name }}</h1>
									<el-tag type="success" size="large">
										v{{ packageInfo.version }}
									</el-tag>
								</div>
								<p class="package-description">
									{{ packageInfo.description || "暂无描述" }}
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
											<div
												v-if="readmeLoading"
												class="loading-content"
											>
												<el-skeleton
													:rows="10"
													animated
												/>
											</div>
											<div
												v-else-if="readmeContent"
												class="readme-content"
											>
												<div
													class="markdown-body"
													v-html="renderedReadme"
												></div>
											</div>
											<div v-else class="no-readme">
												<el-empty
													description="暂无README文档"
												/>
											</div>
										</div>
									</el-tab-pane>

									<el-tab-pane
										label="版本历史"
										name="versions"
									>
										<div class="tab-content">
											<div
												v-if="versionsLoading"
												class="loading-content"
											>
												<el-skeleton
													:rows="5"
													animated
												/>
											</div>
											<div
												v-else
												class="versions-content"
											>
												<div
													v-if="versions.length === 0"
													class="no-versions"
												>
													<el-empty
														description="暂无版本信息"
													/>
												</div>
												<div
													v-else
													class="versions-list"
												>
													<div
														v-for="version in versions"
														:key="version.version"
														class="version-item"
														:class="{
															active:
																version.version ===
																packageInfo.version,
														}"
													>
														<div
															class="version-info"
														>
															<span
																class="version-number"
																>v{{
																	version.version
																}}</span
															>
															<span
																class="version-date"
																>{{
																	formatDate(
																		version.publishTime,
																	)
																}}</span
															>
														</div>
														<div
															class="version-actions"
														>
															<el-button
																v-if="
																	version.version !==
																	packageInfo.version
																"
																size="small"
																@click="
																	switchToVersion(
																		version.version,
																	)
																"
															>
																查看此版本
															</el-button>
															<el-tag
																v-else
																type="success"
																size="small"
															>
																当前版本
															</el-tag>
														</div>
													</div>
												</div>
											</div>
										</div>
									</el-tab-pane>

									<el-tab-pane
										label="依赖"
										name="dependencies"
									>
										<div class="tab-content">
											<div class="dependencies-content">
												<div
													v-if="
														packageInfo.dependencies &&
														Object.keys(
															packageInfo.dependencies,
														).length > 0
													"
												>
													<h3>生产依赖</h3>
													<div class="deps-list">
														<div
															v-for="(
																version, name
															) in packageInfo.dependencies"
															:key="name"
															class="dep-item"
														>
															<span
																class="dep-name"
																>{{
																	name
																}}</span
															>
															<span
																class="dep-version"
																>{{
																	version
																}}</span
															>
														</div>
													</div>
												</div>
												<div
													v-if="
														packageInfo.devDependencies &&
														Object.keys(
															packageInfo.devDependencies,
														).length > 0
													"
												>
													<h3>开发依赖</h3>
													<div class="deps-list">
														<div
															v-for="(
																version, name
															) in packageInfo.devDependencies"
															:key="name"
															class="dep-item"
														>
															<span
																class="dep-name"
																>{{
																	name
																}}</span
															>
															<span
																class="dep-version"
																>{{
																	version
																}}</span
															>
														</div>
													</div>
												</div>
												<div
													v-if="
														(!packageInfo.dependencies ||
															Object.keys(
																packageInfo.dependencies,
															).length === 0) &&
														(!packageInfo.devDependencies ||
															Object.keys(
																packageInfo.devDependencies,
															).length === 0)
													"
												>
													<el-empty
														description="此包暂无依赖项"
													/>
												</div>
											</div>
										</div>
									</el-tab-pane>
								</el-tabs>
							</div>
						</div>
					</div>

					<!-- 右侧信息栏 -->
					<div class="sidebar-section">
						<div class="sidebar-content">
							<!-- 安装命令 -->
							<div class="install-section">
								<h3>安装</h3>
								<div class="install-command">
									<span class="code-text"
										>npm install {{ packageName }}</span
									>
									<el-button
										size="small"
										@click="copyInstallCommand"
										class="copy-btn"
									>
										<el-icon><CopyDocument /></el-icon>
									</el-button>
								</div>
							</div>

							<!-- 包信息 -->
							<div class="package-meta" v-if="packageInfo">
								<h3>包信息</h3>
								<div class="meta-list">
									<div class="meta-item">
										<span class="meta-label">版本</span>
										<span class="meta-value">{{
											packageInfo.version
										}}</span>
									</div>
									<div class="meta-item">
										<span class="meta-label">许可证</span>
										<span class="meta-value">{{
											packageInfo.license || "MIT"
										}}</span>
									</div>
									<div class="meta-item">
										<span class="meta-label">作者</span>
										<span class="meta-value">{{
											packageInfo.author || "未知"
										}}</span>
									</div>
									<div class="meta-item">
										<span class="meta-label">发布时间</span>
										<span class="meta-value">{{
											formatDate(packageInfo.publishTime)
										}}</span>
									</div>
								</div>
							</div>

							<!-- 关键词 -->
							<div
								class="keywords-section"
								v-if="
									packageInfo &&
									packageInfo.keywords &&
									packageInfo.keywords.length
								"
							>
								<h3>关键词</h3>
								<div class="keywords-list">
									<el-tag
										v-for="keyword in packageInfo.keywords"
										:key="keyword"
										size="small"
										class="keyword-tag"
									>
										{{ keyword }}
									</el-tag>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>

		<!-- 安装指南对话框 -->
		<el-dialog v-model="showInstallGuide" title="安装指南" width="600px">
			<div class="install-guide">
				<h4>NPM 安装</h4>
				<div class="code-block">
					<span class="code-text">npm install {{ packageName }}</span>
					<el-button
						size="small"
						@click="copyInstallCommand"
						class="copy-btn"
					>
						<el-icon><CopyDocument /></el-icon>
					</el-button>
				</div>

				<h4>使用方法</h4>
				<div class="code-block">
					<pre><span class="code-html">const {{ packageName.replace(/[^a-zA-Z0-9]/g, '') }} = require('{{ packageName }}')

// 或者使用 ES6 模块语法
import {{ packageName.replace(/[^a-zA-Z0-9]/g, '') }} from '{{ packageName }}'</span></pre>
				</div>
			</div>
		</el-dialog>
	</div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"
import { useRouter, useRoute } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import { House, QuestionFilled, CopyDocument } from "@element-plus/icons-vue"
import { renderMarkdown } from "../utils/markdown.js"
import RepoHeader from "../components/repo/RepoHeader.vue"
import { authUtils } from "../api/auth"

const router = useRouter()
const route = useRoute()

const props = defineProps({
	name: {
		type: String,
		required: true,
	},
})

// 响应式数据
const loading = ref(false)
const packageInfo = ref(null)
const activeTab = ref("readme")
const readmeLoading = ref(false)
const readmeContent = ref("")
const versionsLoading = ref(false)
const versions = ref([])
const showInstallGuide = ref(false)
const repoName = ref(props.name)
const currentUser = ref(null)

// 计算属性
const packageName = computed(() => route.params.name)
const renderedReadme = computed(() => {
	if (!readmeContent.value) return ""
	return renderMarkdown(readmeContent.value)
})

// 方法
const goHome = () => {
	router.push("/")
}

const loadPackageInfo = async () => {
	loading.value = true
	try {
		const token = localStorage.getItem("token")
		const response = await fetch(
			`/api/npm/package/${encodeURIComponent(packageName.value)}`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			},
		)

		const data = await response.json()
		if (data.code === 200) {
			packageInfo.value = data.data
		} else {
			ElMessage.error(data.msg || "加载包信息失败")
		}
	} catch (error) {
		console.error("加载包信息失败:", error)
		ElMessage.error("加载包信息失败")
	} finally {
		loading.value = false
	}
}

const loadReadme = async () => {
	readmeLoading.value = true
	try {
		const token = localStorage.getItem("token")
		const response = await fetch(
			`/api/npm/package/${encodeURIComponent(packageName.value)}/readme`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			},
		)

		const data = await response.json()
		if (data.code === 200) {
			readmeContent.value = data.data || ""
		}
	} catch (error) {
		console.error("加载README失败:", error)
	} finally {
		readmeLoading.value = false
	}
}

const loadVersions = async () => {
	versionsLoading.value = true
	try {
		const token = localStorage.getItem("token")
		const response = await fetch(
			`/api/npm/package/${encodeURIComponent(packageName.value)}/versions`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			},
		)

		const data = await response.json()
		if (data.code === 200) {
			versions.value = data.data || []
		}
	} catch (error) {
		console.error("加载版本信息失败:", error)
	} finally {
		versionsLoading.value = false
	}
}

const switchToVersion = (version) => {
	ElMessage.info(`切换到版本 ${version}`)
	// 这里可以实现版本切换逻辑
}

const copyInstallCommand = async () => {
	const command = `npm install ${packageName.value}`
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

const formatDate = (dateString) => {
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

// 生命周期
onMounted(() => {
	// 获取当前用户信息
	currentUser.value = authUtils.getCurrentUser()

	loadPackageInfo()
	loadReadme()
	loadVersions()
})
</script>

<style scoped>
.npm-package-detail {
	background: #f0f9f0;
	min-height: 100vh;
}

.package-header {
	background: white;
	border-bottom: 1px solid #c2e7b0;
	padding: 16px 0;
}

.header-container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 24px;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.breadcrumb :deep(.el-breadcrumb__item) {
	cursor: pointer;
}

.breadcrumb :deep(.el-breadcrumb__item:hover) {
	color: #67c23a;
}

.main-content {
	padding: 24px 0;
}

.content-container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 24px;
}

.content-layout {
	display: grid;
	grid-template-columns: 1fr 300px;
	gap: 24px;
}

.main-section {
	background: white;
	border-radius: 8px;
	border: 1px solid #c2e7b0;
	overflow: hidden;
}

.package-content {
	padding: 24px;
}

.package-info-section {
	margin-bottom: 24px;
	padding-bottom: 24px;
	border-bottom: 1px solid #f0f0f0;
}

.package-title {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 12px;
}

.package-title h1 {
	margin: 0;
	font-size: 28px;
	font-weight: 600;
	color: #1f2937;
}

.package-description {
	margin: 0;
	color: #6b7280;
	font-size: 16px;
	line-height: 1.6;
}

.detail-tabs :deep(.el-tabs__header) {
	margin-bottom: 0;
	border-bottom: 1px solid #e5e7eb;
}

.detail-tabs :deep(.el-tabs__nav-wrap::after) {
	display: none;
}

.detail-tabs :deep(.el-tabs__active-bar) {
	background-color: #67c23a;
}

.detail-tabs :deep(.el-tabs__item.is-active) {
	color: #67c23a;
}

.tab-content {
	padding: 24px 0;
}

.loading-content {
	padding: 24px;
}

/* 使用与RepoDetail相同的markdown样式 */
.readme-content :deep(.markdown-body) {
	line-height: 1.6;
	color: #24292f;
	font-size: 16px;
	word-wrap: break-word;
	font-family:
		-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica,
		Arial, sans-serif;
}

.readme-content :deep(.markdown-body h1),
.readme-content :deep(.markdown-body h2),
.readme-content :deep(.markdown-body h3),
.readme-content :deep(.markdown-body h4),
.readme-content :deep(.markdown-body h5),
.readme-content :deep(.markdown-body h6) {
	margin-top: 24px;
	margin-bottom: 16px;
	font-weight: 600;
	line-height: 1.25;
	color: #24292f;
}

.readme-content :deep(.markdown-body h1) {
	font-size: 2em;
	padding-bottom: 0.3em;
	border-bottom: 1px solid #d1d9e0;
	margin-bottom: 16px;
}

.readme-content :deep(.markdown-body h2) {
	font-size: 1.5em;
	padding-bottom: 0.3em;
	border-bottom: 1px solid #d1d9e0;
}

.readme-content :deep(.markdown-body p) {
	margin-top: 0;
	margin-bottom: 16px;
}

.readme-content :deep(.markdown-body .code-inline) {
	padding: 0.2em 0.4em;
	margin: 0;
	font-size: 85%;
	background-color: rgba(175, 184, 193, 0.2);
	border-radius: 6px;
	font-family:
		ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
		"Liberation Mono", monospace;
}

.readme-content :deep(.markdown-body pre) {
	padding: 16px;
	overflow: auto;
	font-size: 85%;
	line-height: 1.45;
	background-color: #f6f8fa;
	border-radius: 6px;
	margin: 16px 0;
}

.versions-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.version-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	transition: all 0.2s;
}

.version-item:hover {
	border-color: #67c23a;
	background: #f0f9f0;
}

.version-item.active {
	border-color: #67c23a;
	background: #f0f9f0;
}

.version-info {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.version-number {
	font-weight: 600;
	color: #1f2937;
}

.version-date {
	font-size: 12px;
	color: #6b7280;
}

.dependencies-content h3 {
	margin-bottom: 16px;
	color: #1f2937;
}

.deps-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.dep-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px 12px;
	background: #f9fafb;
	border-radius: 4px;
}

.dep-name {
	font-weight: 500;
	color: #374151;
}

.dep-version {
	font-family: "Courier New", monospace;
	color: #6b7280;
	font-size: 12px;
}

.sidebar-section {
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.sidebar-content > div {
	background: white;
	border: 1px solid #c2e7b0;
	border-radius: 8px;
	padding: 20px;
}

.sidebar-content h3 {
	margin: 0 0 16px 0;
	font-size: 16px;
	font-weight: 600;
	color: #1f2937;
}

.install-command {
	display: flex;
	align-items: center;
	gap: 8px;
	background: #f3f4f6;
	padding: 12px;
	border-radius: 6px;
}

.install-command .code-text {
	flex: 1;
	background: none;
	color: #374151;
}

.copy-btn {
	min-width: 32px;
	height: 32px;
	padding: 0;
}

.meta-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.meta-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.meta-label {
	color: #6b7280;
	font-size: 14px;
}

.meta-value {
	color: #374151;
	font-weight: 500;
	font-size: 14px;
}

.keywords-list {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.keyword-tag {
	background: #f0f9f0;
	color: #059669;
	border-color: #c2e7b0;
}

.install-guide h4 {
	margin: 16px 0 8px 0;
	color: #1f2937;
}

.install-guide h4:first-child {
	margin-top: 0;
}

.code-block {
	background: #f3f4f6;
	padding: 16px;
	border-radius: 6px;
	margin-bottom: 16px;
	position: relative;
}

.code-block .code-text,
.code-block .code-html,
.code-block pre {
	background: none;
	color: #374151;
}

.code-block .copy-btn {
	position: absolute;
	top: 8px;
	right: 8px;
}

@media (max-width: 768px) {
	.content-layout {
		grid-template-columns: 1fr;
	}

	.header-container {
		flex-direction: column;
		gap: 16px;
		align-items: flex-start;
	}
}
</style>
