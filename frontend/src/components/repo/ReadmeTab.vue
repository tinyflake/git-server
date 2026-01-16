<template>
	<div class="readme-container" v-loading="readmeLoading">
		<div v-if="readmeContent" class="readme-wrapper">
			<!-- 目录 -->
			<div v-if="showToc && readmeHeadings.length > 0" class="readme-toc">
				<div class="toc-header">
					<h4>目录</h4>
				</div>
				<ul class="toc-list">
					<li
						v-for="heading in readmeHeadings"
						:key="heading.anchor"
						:class="`toc-level-${heading.level}`"
						class="toc-item"
					>
						<a
							href="#"
							@click.prevent="scrollToHeading(heading.anchor)"
							class="toc-link"
						>
							{{ heading.text }}
						</a>
					</li>
				</ul>
			</div>
			<div class="readme-content">
				<div class="markdown-body" v-html="renderedReadme"></div>
			</div>
		</div>

		<!-- 无README文件状态 -->
		<div v-else-if="!readmeLoading" class="no-readme">
			<div class="no-readme-content">
				<el-icon class="no-readme-icon"><Document /></el-icon>
				<h3>没有找到 README.md 文件</h3>
				<p>这个仓库还没有 README.md 文件</p>
				<div class="readme-suggestion">
					<h4>建议添加 README.md 文件：</h4>
					<div class="command-box">
						<code>echo "# {{ repoName }}" > README.md</code>
						<el-button
							size="small"
							@click="
								copyCommand(
									`echo &quot;# ${repoName}&quot; > README.md`
								)
							"
							:icon="CopyDocument"
						/>
					</div>
					<div class="command-box">
						<code>git add README.md</code>
						<el-button
							size="small"
							@click="copyCommand('git add README.md')"
							:icon="CopyDocument"
						/>
					</div>
					<div class="command-box">
						<code>git commit -m "Add README"</code>
						<el-button
							size="small"
							@click="
								copyCommand(
									'git commit -m &quot;Add README&quot;'
								)
							"
							:icon="CopyDocument"
						/>
					</div>
					<div class="command-box">
						<code>git push origin main</code>
						<el-button
							size="small"
							@click="copyCommand('git push origin main')"
							:icon="CopyDocument"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { Document, CopyDocument } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"

defineProps({
	readmeLoading: Boolean,
	readmeContent: String,
	renderedReadme: String,
	readmeHeadings: Array,
	showToc: Boolean,
	repoName: String,
	scrollToHeading: Function,
})

const copyCommand = async (text) => {
	try {
		await navigator.clipboard.writeText(text)
		ElMessage.success("已复制到剪贴板")
	} catch (error) {
		ElMessage.error("复制失败")
	}
}
</script>

<style scoped>
.readme-container {
	min-height: 400px;
	position: relative;
}
li {
	list-style: none !important;
}
.readme-wrapper {
	display: block;
	position: relative;
}

.readme-toc {
	width: 280px;
	background: #ffffff;
	border: 1px solid #d1d9e0;
	border-radius: 6px;
	padding: 20px;
	position: fixed;
	top: 200px;
	left: calc((100vw - 1200px) / 2 - 300px);
	max-height: calc(100vh - 240px);
	overflow-y: auto;
	flex-shrink: 0;
	z-index: 100;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.toc-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
	padding-bottom: 8px;
	border-bottom: 1px solid #d1d9e0;
}

.toc-header h4 {
	margin: 0;
	font-size: 16px;
	font-weight: 600;
	color: #24292f;
}

.toc-list {
	list-style: none !important;
	padding: 0;
	margin: 0;
}

.toc-item {
	margin-bottom: 2px;
}

.toc-link {
	display: block;
	padding: 8px 12px;
	color: #656d76;
	text-decoration: none;
	font-size: 14px;
	border-radius: 4px;
	transition: all 0.15s ease;
	line-height: 1.5;
}

.toc-link:hover {
	background-color: #f6f8fa;
	color: #24292f;
	text-decoration: none;
}

.toc-level-1 .toc-link {
	font-weight: 600;
	color: #24292f;
	font-size: 15px;
}

.toc-level-2 .toc-link {
	padding-left: 24px;
	font-size: 14px;
}

.toc-level-3 .toc-link {
	padding-left: 36px;
	font-size: 13px;
	color: #8b949e;
}

.readme-toc::-webkit-scrollbar {
	width: 4px;
}

.readme-toc::-webkit-scrollbar-track {
	background: transparent;
}

.readme-toc::-webkit-scrollbar-thumb {
	background: #d1d9e0;
	border-radius: 2px;
}

.readme-toc::-webkit-scrollbar-thumb:hover {
	background: #8b949e;
}

.readme-content {
	flex: 1;
	min-width: 0;
	margin-right: 0;
	padding: 0 16px;
}

/* GitHub 风格的 Markdown 样式 */
.readme-content :deep(.markdown-body) {
	line-height: 1.6;
	color: #24292f;
	font-size: 16px;
	word-wrap: break-word;
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans",
		Helvetica, Arial, sans-serif;
}

/* 标题样式 */
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

.readme-content :deep(.markdown-body h3) {
	font-size: 1.25em;
}

.readme-content :deep(.markdown-body h4) {
	font-size: 1em;
}

.readme-content :deep(.markdown-body h5) {
	font-size: 0.875em;
}

.readme-content :deep(.markdown-body h6) {
	font-size: 0.85em;
	color: #656d76;
}

/* 段落样式 */
.readme-content :deep(.markdown-body p) {
	margin-top: 0;
	margin-bottom: 16px;
}

/* 引用块样式 */
.readme-content :deep(.markdown-body blockquote) {
	padding: 0 1em;
	color: #656d76;
	border-left: 0.25em solid #d1d9e0;
	margin: 0 0 16px 0;
}

/* 列表样式 */
.readme-content :deep(.markdown-body ul),
.readme-content :deep(.markdown-body ol) {
	margin-top: 0;
	margin-bottom: 16px;
	padding-left: 2em;
}

.readme-content :deep(.markdown-body li) {
	margin-bottom: 0.25em;
}

.readme-content :deep(.markdown-body ul li) {
	list-style-type: disc;
}

.readme-content :deep(.markdown-body ol li) {
	list-style-type: decimal;
}

/* 内联代码样式 */
.readme-content :deep(.markdown-body code) {
	padding: 0.2em 0.4em;
	margin: 0;
	font-size: 85%;
	background-color: rgba(175, 184, 193, 0.2);
	border-radius: 6px;
	font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
		"Liberation Mono", monospace;
}

/* 代码块样式 */
.readme-content :deep(.markdown-body pre) {
	padding: 16px;
	overflow: auto;
	font-size: 85%;
	line-height: 1.45;
	background-color: #f6f8fa;
	border-radius: 6px;
	margin: 16px 0;
}

.readme-content :deep(.markdown-body pre code) {
	display: block;
	padding: 0;
	margin: 0;
	overflow: visible;
	line-height: inherit;
	word-wrap: normal;
	background-color: transparent;
	border: 0;
	font-size: 100%;
}

/* 代码高亮样式 */
.readme-content :deep(.markdown-body pre .hljs-keyword),
.readme-content :deep(.markdown-body pre .hljs-selector-tag),
.readme-content :deep(.markdown-body pre .hljs-built_in) {
	color: #cf222e;
}

.readme-content :deep(.markdown-body pre .hljs-string),
.readme-content :deep(.markdown-body pre .hljs-attr) {
	color: #0a3069;
}

.readme-content :deep(.markdown-body pre .hljs-number),
.readme-content :deep(.markdown-body pre .hljs-literal) {
	color: #0550ae;
}

.readme-content :deep(.markdown-body pre .hljs-comment) {
	color: #6e7781;
	font-style: italic;
}

.readme-content :deep(.markdown-body pre .hljs-function),
.readme-content :deep(.markdown-body pre .hljs-title) {
	color: #8250df;
}

.readme-content :deep(.markdown-body pre .hljs-variable) {
	color: #953800;
}

/* 表格样式 */
.readme-content :deep(.markdown-body table) {
	border-spacing: 0;
	border-collapse: collapse;
	width: 100%;
	margin-bottom: 16px;
	border: 1px solid #d1d9e0;
	border-radius: 6px;
	overflow: hidden;
}

.readme-content :deep(.markdown-body table th),
.readme-content :deep(.markdown-body table td) {
	padding: 6px 13px;
	border: 1px solid #d1d9e0;
}

.readme-content :deep(.markdown-body table th) {
	font-weight: 600;
	background-color: #f6f8fa;
}

.readme-content :deep(.markdown-body table tr:nth-child(2n)) {
	background-color: #f6f8fa;
}

/* 链接样式 */
.readme-content :deep(.markdown-body a) {
	color: #0969da;
	text-decoration: none;
}

.readme-content :deep(.markdown-body a:hover) {
	text-decoration: underline;
}

/* 强调文本 */
.readme-content :deep(.markdown-body strong) {
	font-weight: 600;
}

.readme-content :deep(.markdown-body em) {
	font-style: italic;
}

/* 图片样式 */
.readme-content :deep(.markdown-body img) {
	max-width: 100%;
	height: auto;
	border-radius: 6px;
	margin: 16px 0;
}

/* 分割线样式 */
.readme-content :deep(.markdown-body hr) {
	height: 0.25em;
	padding: 0;
	margin: 24px 0;
	background-color: #d1d9e0;
	border: 0;
	border-radius: 2px;
}

/* 任务列表样式 */
.readme-content :deep(.markdown-body input[type="checkbox"]) {
	margin-right: 0.5em;
}

/* 删除线 */
.readme-content :deep(.markdown-body del) {
	text-decoration: line-through;
}

.no-readme {
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 400px;
}

.no-readme-content {
	text-align: center;
	max-width: 600px;
}

.no-readme-icon {
	font-size: 64px;
	color: #d1d5db;
	margin-bottom: 16px;
}

.no-readme-content h3 {
	margin: 0 0 8px 0;
	font-size: 20px;
	color: #374151;
}

.no-readme-content p {
	margin: 0 0 32px 0;
	color: #6b7280;
	font-size: 16px;
}

.readme-suggestion {
	text-align: left;
	background: #f9fafb;
	padding: 24px;
	border-radius: 8px;
	border: 1px solid #e5e7eb;
}

.readme-suggestion h4 {
	margin: 0 0 16px 0;
	font-size: 16px;
	color: #374151;
}

.readme-suggestion .command-box {
	margin-bottom: 8px;
}

.command-box {
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

.command-box code {
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

@media (max-width: 1024px) {
	.readme-toc {
		position: static;
		width: 100%;
		margin-bottom: 24px;
		top: auto;
		left: auto;
		max-height: none;
		box-shadow: none;
	}

	.readme-wrapper {
		display: block;
	}

	.readme-content {
		margin-left: 0;
		margin-right: 0;
	}
}
</style>
