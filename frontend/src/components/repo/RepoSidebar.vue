<template>
	<aside class="sidebar">
		<div class="sidebar-content">
			<!-- 安装命令 -->
			<div class="sidebar-section">
				<div class="install-header">
					<h4>安装</h4>
					<el-button
						size="small"
						type="primary"
						plain
						@click="copyFullInstallCommand(activePackageManager)"
					>
						一键复制
					</el-button>
				</div>
				<div class="install-commands">
					<!-- 包管理器选择 -->
					<div class="package-manager-selector">
						<el-radio-group
							v-model="activePackageManager"
							size="small"
						>
							<el-radio-button label="npm">npm</el-radio-button>
							<el-radio-button label="yarn">yarn</el-radio-button>
							<el-radio-button label="pnpm">pnpm</el-radio-button>
						</el-radio-group>
					</div>

					<!-- 命令显示 -->
					<div class="install-steps">
						<div class="install-step">
							<div class="step-number">1</div>
							<div class="step-content">
								<div class="step-title">设置镜像源</div>
								<div class="command-input">
									<code
										>{{ activePackageManager }} config set
										registry http://{{ serverIP }}:{{
											serverPort
										}}/</code
									>
									<el-button
										size="small"
										@click="
											copyToClipboard(
												`${activePackageManager} config set registry http://${serverIP}:${serverPort}/`
											)
										"
										:icon="CopyDocument"
									/>
								</div>
							</div>
						</div>

						<div class="install-step">
							<div class="step-number">2</div>
							<div class="step-content">
								<div class="step-title">安装包</div>
								<div class="command-input">
									<code>{{
										getInstallCommand(activePackageManager)
									}}</code>
									<el-button
										size="small"
										@click="
											copyToClipboard(
												getInstallCommand(
													activePackageManager
												)
											)
										"
										:icon="CopyDocument"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 仓库信息 -->
			<div class="sidebar-section">
				<h4>仓库</h4>
				<div class="repo-links">
					<a :href="gitUrl" class="repo-link" target="_blank">
						<el-icon><Link /></el-icon>
						仓库地址
					</a>
				</div>
			</div>

			<!-- 主页 -->
			<div class="sidebar-section">
				<h4>主页</h4>
				<div class="homepage-link">
					<a :href="gitUrl" target="_blank">{{ gitUrl }}</a>
				</div>
			</div>

			<!-- 版本信息 -->
			<div class="sidebar-section">
				<div class="version-header">
					<h4>当前版本</h4>
					<el-button
						v-if="currentVersion && !currentVersion.isLatest"
						size="small"
						type="primary"
						plain
						@click="$emit('reset-version')"
					>
						回到最新
					</el-button>
				</div>
				<div class="version-info" v-if="displayVersionInfo">
					<div class="current-version">
						<span class="version-number">{{
							displayVersionInfo.version || "未知"
						}}</span>
						<span
							v-if="displayVersionInfo.isLatest"
							class="version-tag latest"
							>latest</span
						>
						<span v-else class="version-tag">{{
							displayVersionInfo.shortHash
						}}</span>
					</div>
					<div class="version-date">
						发布于 {{ formatDate(displayVersionInfo.date) }}
					</div>
					<div
						v-if="displayVersionInfo.message"
						class="version-message"
					>
						{{ displayVersionInfo.message }}
					</div>

					<!-- 下载按钮 -->
					<div class="version-actions">
						<el-button
							type="primary"
							size="small"
							@click="$emit('download-version')"
							:icon="Download"
						>
							下载此版本
						</el-button>
					</div>
				</div>
			</div>

			<!-- 许可证 -->
			<div class="sidebar-section">
				<h4>许可证</h4>
				<div class="license-info">
					<span class="license-name">{{
						repoInfo.license || "MIT"
					}}</span>
				</div>
			</div>

			<!-- 最后更新者 -->
			<div class="sidebar-section">
				<h4>
					{{
						displayVersionInfo?.isLatest ? "最后更新者" : "版本作者"
					}}
				</h4>
				<div class="maintainer-info" v-if="displayVersionInfo">
					<div class="maintainer-item">
						<el-icon><User /></el-icon>
						<div class="maintainer-details">
							<div class="maintainer-name">
								{{ displayVersionInfo.author || "Unknown" }}
							</div>
							<div
								v-if="displayVersionInfo.email"
								class="maintainer-email"
							>
								{{ displayVersionInfo.email }}
							</div>
							<div
								v-if="displayVersionInfo.message"
								class="last-commit"
							>
								<span class="commit-message">{{
									displayVersionInfo.message
								}}</span>
								<span
									v-if="displayVersionInfo.shortHash"
									class="commit-hash"
								>
									({{ displayVersionInfo.shortHash }})
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 关键词 -->
			<div
				class="sidebar-section"
				v-if="repoInfo.keywords && repoInfo.keywords.length"
			>
				<h4>关键词</h4>
				<div class="keywords-list">
					<span
						v-for="keyword in repoInfo.keywords"
						:key="keyword"
						class="keyword-tag"
					>
						{{ keyword }}
					</span>
				</div>
			</div>

			<!-- 统计信息 -->
			<div class="sidebar-section">
				<h4>统计</h4>
				<div class="stats-info" v-if="displayVersionInfo">
					<div class="stat-item">
						<span class="stat-label">{{
							displayVersionInfo.isLatest
								? "最后更新"
								: "版本发布"
						}}</span>
						<span class="stat-value">{{
							formatDate(displayVersionInfo.date)
						}}</span>
					</div>
					<div v-if="displayVersionInfo.hash" class="stat-item">
						<span class="stat-label">提交哈希</span>
						<span class="stat-value commit-hash-value">{{
							displayVersionInfo.shortHash
						}}</span>
					</div>
				</div>
			</div>
		</div>
	</aside>
</template>

<script setup>
import { ref } from "vue"
import { ElMessage } from "element-plus"
import { CopyDocument, Link, Download, User } from "@element-plus/icons-vue"

const props = defineProps({
	repoInfo: Object,
	gitUrl: String,
	serverIP: String,
	serverPort: String,
	repoName: String,
	currentVersion: Object,
	displayVersionInfo: Object,
	formatDate: Function,
})

defineEmits(["reset-version", "download-version"])

const activePackageManager = ref("npm")

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

const copyFullInstallCommand = (packageManager = "npm") => {
	const registryCommand = `${packageManager} config set registry http://${props.serverIP}:${props.serverPort}/`
	const installCommand = getInstallCommand(packageManager)
	const fullCommand = `${registryCommand}\n${installCommand}`
	copyToClipboard(fullCommand)
}

const getInstallCommand = (packageManager) => {
	switch (packageManager) {
		case "yarn":
			return `yarn add ${props.repoName}`
		case "pnpm":
			return `pnpm add ${props.repoName}`
		default:
			return `npm install ${props.repoName}`
	}
}
</script>

<style scoped>
.sidebar {
	position: sticky;
	top: 32px;
	height: fit-content;
}

.sidebar-content {
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	overflow: hidden;
}

.sidebar-section {
	padding: 20px;
	border-bottom: 1px solid #f3f4f6;
}

.sidebar-section:last-child {
	border-bottom: none;
}

.sidebar-section h4 {
	margin: 0 0 12px 0;
	font-size: 14px;
	font-weight: 600;
	color: #111827;
}

.version-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
}

.version-header h4 {
	margin: 0;
}

.install-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
}

.install-header h4 {
	margin: 0;
}

.install-commands {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.package-manager-selector {
	display: flex;
	justify-content: center;
}

.package-manager-selector :deep(.el-radio-group) {
	width: 100%;
}

.package-manager-selector :deep(.el-radio-button) {
	flex: 1;
}

.package-manager-selector :deep(.el-radio-button__inner) {
	width: 100%;
	text-align: center;
	font-size: 12px;
	padding: 6px 8px;
}

.install-steps {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.install-step {
	display: flex;
	align-items: flex-start;
	gap: 12px;
}

.step-number {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	background: #10b981;
	color: white;
	border-radius: 50%;
	font-size: 11px;
	font-weight: 600;
	flex-shrink: 0;
	margin-top: 4px;
}

.step-content {
	flex: 1;
	min-width: 0;
}

.step-title {
	font-size: 12px;
	font-weight: 600;
	color: #374151;
	margin-bottom: 6px;
}

.command-input {
	display: flex;
	align-items: center;
	padding: 8px 12px;
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", monospace;
	min-height: 36px;
}

.command-input code {
	flex: 1;
	background: none;
	border: none;
	font-size: 12px;
	color: #111827;
	word-break: break-all;
	line-height: 1.4;
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", monospace;
}

.command-input .el-button {
	margin-left: 8px;
	flex-shrink: 0;
}

.repo-links {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.repo-link {
	display: flex;
	align-items: center;
	gap: 6px;
	color: #10b981;
	text-decoration: none;
	font-size: 14px;
}

.repo-link:hover {
	text-decoration: underline;
}

.repo-link .el-icon {
	font-size: 16px;
}

.homepage-link a {
	color: #10b981;
	text-decoration: none;
	font-size: 14px;
	word-break: break-all;
}

.homepage-link a:hover {
	text-decoration: underline;
}

.version-info {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.current-version {
	display: flex;
	align-items: center;
	gap: 8px;
}

.current-version .version-number {
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", monospace;
	font-weight: 600;
	color: #111827;
}

.current-version .version-tag {
	background: #10b981;
	color: white;
	padding: 2px 6px;
	border-radius: 3px;
	font-size: 11px;
	font-weight: 500;
}

.version-date {
	color: #6b7280;
	font-size: 13px;
}

.version-message {
	color: #6b7280;
	font-size: 12px;
	line-height: 1.4;
	margin-top: 4px;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.version-actions {
	margin-top: 12px;
	display: flex;
	gap: 8px;
}

.version-actions .el-button {
	flex: 1;
}

.commit-hash-value {
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", monospace;
	background: #f3f4f6;
	padding: 2px 6px;
	border-radius: 3px;
	font-size: 12px;
}

.license-info {
	display: flex;
	align-items: center;
}

.license-name {
	background: #f0f9ff;
	color: #0369a1;
	padding: 4px 8px;
	border-radius: 4px;
	font-size: 13px;
	font-weight: 500;
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", monospace;
}

.maintainer-info {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.maintainer-item {
	display: flex;
	align-items: flex-start;
	gap: 8px;
	color: #374151;
	font-size: 14px;
}

.maintainer-item .el-icon {
	color: #6b7280;
	font-size: 16px;
	margin-top: 2px;
	flex-shrink: 0;
}

.maintainer-details {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.maintainer-name {
	font-weight: 600;
	color: #111827;
}

.maintainer-email {
	font-size: 12px;
	color: #6b7280;
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", monospace;
}

.last-commit {
	font-size: 12px;
	color: #6b7280;
	line-height: 1.4;
}

.commit-message {
	display: block;
	margin-bottom: 2px;
}

.commit-hash {
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", monospace;
	background: #f3f4f6;
	padding: 1px 4px;
	border-radius: 3px;
	font-size: 11px;
}

.keywords-list {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.keyword-tag {
	background: #f3f4f6;
	color: #374151;
	padding: 4px 8px;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 500;
}

.stats-info {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.stat-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.stat-label {
	color: #6b7280;
	font-size: 13px;
}

.stat-value {
	color: #111827;
	font-size: 13px;
	font-weight: 500;
}
</style>
