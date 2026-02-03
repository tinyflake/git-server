<template>
	<aside class="sidebar">
		<div class="sidebar-content">
			<!-- Clone -->
			<div class="sidebar-section">
				<div class="section-header">
					<h4>仓库地址</h4>
					<el-button
						size="small"
						type="primary"
						plain
						@click="copyToClipboard(gitUrl)"
						:disabled="!gitUrl"
					>
						一键复制
					</el-button>
				</div>
				<div class="command-input">
					<span class="code-text">{{ gitUrl || "暂无" }}</span>
				</div>
			</div>

			<!-- Quick commands -->
			<div class="sidebar-section">
				<h4>快捷命令</h4>
				<div class="quick-commands">
					<div class="quick-item">
						<div class="quick-title">克隆</div>
						<div class="command-input">
							<span class="code-text">git clone {{ gitUrl }}</span>
							<el-button
								size="small"
								@click="copyToClipboard(`git clone ${gitUrl}`)"
								:icon="CopyDocument"
								:disabled="!gitUrl"
							/>
						</div>
					</div>

					<div class="quick-item">
						<div class="quick-title">添加远端</div>
						<div class="command-input">
							<span class="code-text"
								>git remote add origin {{ gitUrl }}</span
							>
							<el-button
								size="small"
								@click="
									copyToClipboard(
										`git remote add origin ${gitUrl}`
									)
								"
								:icon="CopyDocument"
								:disabled="!gitUrl"
							/>
						</div>
					</div>

					<div class="quick-item">
						<div class="quick-title">首次推送（main）</div>
						<div class="command-input">
							<span class="code-text">git push -u origin main</span>
							<el-button
								size="small"
								@click="copyToClipboard('git push -u origin main')"
								:icon="CopyDocument"
							/>
						</div>
					</div>
				</div>
			</div>

			<!-- Latest commit -->
			<div class="sidebar-section">
				<h4>最新提交</h4>
				<div v-if="latestCommit" class="commit-card">
					<div class="commit-line">
						<span class="label">作者</span>
						<span class="value">{{ latestCommit.author || "Unknown" }}</span>
					</div>
					<div class="commit-line" v-if="latestCommit.date">
						<span class="label">时间</span>
						<span class="value">{{ formatDate(latestCommit.date) }}</span>
					</div>
					<div class="commit-message" v-if="latestCommit.message">
						{{ latestCommit.message }}
					</div>
					<div class="commit-hash-row" v-if="latestCommit.shortHash">
						<span class="hash">{{ latestCommit.shortHash }}</span>
						<el-button
							size="small"
							text
							@click="copyToClipboard(latestCommit.hash || latestCommit.shortHash)"
						>
							复制
						</el-button>
					</div>
				</div>
				<div v-else class="muted">暂无提交信息</div>
			</div>

			<!-- Repo meta -->
			<div class="sidebar-section">
				<h4>仓库信息</h4>
				<div class="meta-grid">
					<div class="meta-item">
						<span class="label">名称</span>
						<span class="value mono">{{ repoName }}</span>
					</div>
					<div class="meta-item" v-if="repoInfo?.creator">
						<span class="label">创建者</span>
						<span class="value">{{ repoInfo.creator }}</span>
					</div>
					<div class="meta-item" v-if="repoInfo?.repoPath">
						<span class="label">路径</span>
						<span class="value mono">{{ repoInfo.repoPath }}</span>
					</div>
				</div>
			</div>
		</div>
	</aside>
</template>

<script setup>
import { computed } from "vue"
import { ElMessage } from "element-plus"
import { CopyDocument } from "@element-plus/icons-vue"

const props = defineProps({
	repoName: { type: String, required: true },
	gitUrl: { type: String, default: "" },
	repoInfo: { type: Object, default: null },
	displayVersionInfo: { type: Object, default: null },
	formatDate: { type: Function, required: true },
})

const latestCommit = computed(() => {
	if (!props.displayVersionInfo) return null
	return {
		author: props.displayVersionInfo.author,
		date: props.displayVersionInfo.date,
		message: props.displayVersionInfo.message,
		hash: props.displayVersionInfo.hash,
		shortHash: props.displayVersionInfo.shortHash,
	}
})

const copyToClipboard = async (text) => {
	if (!text) return
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

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
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
	gap: 8px;
}

.command-input .code-text {
	flex: 1;
	background: none;
	border: none;
	font-size: 12px;
	color: #111827;
	word-break: break-all;
	line-height: 1.4;
}

.quick-commands {
	display: flex;
	flex-direction: column;
	gap: 14px;
}

.quick-title {
	font-size: 12px;
	font-weight: 600;
	color: #374151;
	margin-bottom: 6px;
}

.commit-card {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.commit-line {
	display: flex;
	justify-content: space-between;
	gap: 12px;
}

.label {
	color: #6b7280;
	font-size: 12px;
	flex-shrink: 0;
}

.value {
	color: #111827;
	font-size: 12px;
	text-align: right;
	word-break: break-word;
}

.commit-message {
	color: #374151;
	font-size: 12px;
	line-height: 1.4;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.commit-hash-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
}

.hash {
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", monospace;
	background: #f3f4f6;
	padding: 2px 6px;
	border-radius: 4px;
	font-size: 12px;
	color: #111827;
}

.meta-grid {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.meta-item {
	display: flex;
	justify-content: space-between;
	gap: 12px;
}

.mono {
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", monospace;
}

.muted {
	color: #6b7280;
	font-size: 12px;
}
</style>

