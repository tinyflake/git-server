<template>
	<div>
		<!-- 无权限提示 - 居中显示 -->
		<div v-if="!hasCodeViewPermission" class="no-permission-container">
			<div class="no-permission-content">
				<el-icon class="no-permission-icon" :size="80">
					<Lock />
				</el-icon>
				<h3 class="no-permission-title">暂无权限，请联系管理员</h3>
				<p class="no-permission-desc">您没有查看此仓库代码的权限</p>
				<el-button type="primary" size="large" @click="contactAdmin">
					联系管理员开通权限
				</el-button>
			</div>
		</div>

		<!-- 有权限时显示文件浏览 -->
		<div v-else class="files-content" v-loading="filesLoading">
			<div class="files-header">
				<div class="files-toolbar">
					<el-select
						:model-value="currentBranch"
						placeholder="选择分支"
						size="small"
						style="width: 150px"
						@update:model-value="
							$emit('update:currentBranch', $event)
						"
						@change="handleBranchChange"
					>
						<el-option
							v-for="branch in branches"
							:key="branch.name"
							:label="branch.name"
							:value="branch.name"
						>
							<span>{{ branch.name }}</span>
							<el-tag
								v-if="branch.isCurrent"
								size="small"
								type="success"
								style="margin-left: 8px"
								>当前</el-tag
							>
						</el-option>
					</el-select>
					<el-input
						:model-value="fileSearch"
						@update:model-value="$emit('update:fileSearch', $event)"
						placeholder="搜索文件名..."
						size="small"
						clearable
						style="width: 250px; margin-left: 12px"
					>
						<template #prefix>
							<el-icon><Search /></el-icon>
						</template>
					</el-input>
				</div>
			</div>

			<div class="files-layout">
				<!-- 左侧文件树 -->
				<div class="file-tree-panel">
					<el-tree
						:data="fileTreeData"
						:props="fileTreeProps"
						:load="loadNode"
						lazy
						node-key="path"
						:highlight-current="true"
						:expand-on-click-node="false"
						@node-click="handleFileClick"
						:filter-node-method="filterFileNode"
						ref="fileTreeRef"
					>
						<template #default="{ node, data }">
							<span class="custom-tree-node">
								<el-icon v-if="data.type === 'directory'"
									><Folder
								/></el-icon>
								<el-icon v-else><Document /></el-icon>
								<span>{{ node.label }}</span>
								<span v-if="data.size" class="file-size">{{
									formatFileSize(data.size)
								}}</span>
							</span>
						</template>
					</el-tree>
				</div>

				<!-- 右侧文件预览 -->
				<div class="file-preview-panel">
					<div v-if="!selectedFile" class="no-file-selected">
						<el-icon class="no-file-icon"><Document /></el-icon>
						<p>请从左侧选择文件查看</p>
					</div>

					<div
						v-else-if="fileContentLoading"
						class="file-loading"
						v-loading="true"
					></div>

					<div v-else class="file-content-wrapper">
						<!-- 文件头部 -->
						<div class="file-header">
							<div class="file-info">
								<el-icon><Document /></el-icon>
								<span class="file-name">{{
									selectedFile.name
								}}</span>
								<span
									v-if="selectedFile.size"
									class="file-size-badge"
									>{{
										formatFileSize(selectedFile.size)
									}}</span
								>
							</div>
							<div class="file-actions">
								<el-button
									size="small"
									@click="copyFileContent"
									:icon="CopyDocument"
								>
									复制
								</el-button>
								<el-button
									size="small"
									type="primary"
									@click="downloadCurrentFile"
									:icon="Download"
								>
									下载
								</el-button>
							</div>
						</div>

						<!-- 文件内容 -->
						<div class="file-content">
							<!-- 图片预览 -->
							<div
								v-if="fileContent.isImage"
								class="image-preview"
							>
								<el-image
									:src="`data:image/${fileContent.extension.replace(
										'.',
										''
									)};base64,${btoa(fileContent.content)}`"
									fit="contain"
									:preview-src-list="[
										`data:image/${fileContent.extension.replace(
											'.',
											''
										)};base64,${btoa(fileContent.content)}`,
									]"
								/>
							</div>

							<!-- 文件过大提示 -->
							<div
								v-else-if="fileContent.tooLarge"
								class="file-too-large"
							>
								<el-icon class="warning-icon"
									><Warning
								/></el-icon>
								<p>文件过大（>5MB），无法预览</p>
								<el-button
									type="primary"
									@click="downloadCurrentFile"
									:icon="Download"
								>
									下载文件
								</el-button>
							</div>

							<!-- 二进制文件提示 -->
							<div
								v-else-if="
									fileContent.isBinary && !fileContent.isImage
								"
								class="binary-file"
							>
								<el-icon class="info-icon"
									><Document
								/></el-icon>
								<p>二进制文件，无法预览</p>
								<el-button
									type="primary"
									@click="downloadCurrentFile"
									:icon="Download"
								>
									下载文件
								</el-button>
							</div>

							<!-- 代码预览 -->
							<pre
								v-else
								class="code-preview"
							><code v-html="highlightedCode"></code></pre>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import {
	Lock,
	Search,
	Folder,
	Document,
	CopyDocument,
	Download,
	Warning,
} from "@element-plus/icons-vue"

defineProps({
	hasCodeViewPermission: Boolean,
	contactAdmin: Function,
	filesLoading: Boolean,
	branches: Array,
	currentBranch: String,
	fileSearch: String,
	fileTreeData: Array,
	fileTreeProps: Object,
	loadNode: Function,
	handleFileClick: Function,
	filterFileNode: Function,
	fileTreeRef: Object,
	selectedFile: Object,
	fileContentLoading: Boolean,
	fileContent: Object,
	highlightedCode: String,
	formatFileSize: Function,
	handleBranchChange: Function,
	copyFileContent: Function,
	downloadCurrentFile: Function,
})

defineEmits(["update:currentBranch", "update:fileSearch"])
</script>

<style scoped>
/* 无权限提示样式 */
.no-permission-container {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 500px;
	padding: 60px 20px;
}

.no-permission-content {
	text-align: center;
	max-width: 500px;
}

.no-permission-icon {
	color: #f56c6c;
	margin-bottom: 24px;
}

.no-permission-title {
	margin: 0 0 12px 0;
	font-size: 24px;
	font-weight: 600;
	color: #303133;
}

.no-permission-desc {
	margin: 0 0 32px 0;
	font-size: 16px;
	color: #606266;
	line-height: 1.6;
}

.files-content {
	padding: 0;
}

.files-header {
	padding: 16px 0;
	border-bottom: 1px solid #e5e7eb;
	margin-bottom: 16px;
}

.files-toolbar {
	display: flex;
	align-items: center;
	gap: 12px;
}

.files-layout {
	display: grid;
	grid-template-columns: 300px 1fr;
	gap: 16px;
	min-height: 1000px;
}

.file-tree-panel {
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 12px;
	overflow-y: auto;
	max-height: 1000px;
	background: #fafafa;
}

.custom-tree-node {
	display: flex;
	align-items: center;
	gap: 6px;
	flex: 1;
	padding: 4px 0;
}

.custom-tree-node .el-icon {
	font-size: 16px;
	color: #6b7280;
}

.file-size {
	margin-left: auto;
	font-size: 12px;
	color: #9ca3af;
}

.file-preview-panel {
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	overflow: hidden;
	background: white;
}

.no-file-selected {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 600px;
	color: #9ca3af;
}

.no-file-icon {
	font-size: 64px;
	margin-bottom: 16px;
}

.file-loading {
	height: 600px;
}

.file-content-wrapper {
	display: flex;
	flex-direction: column;
	height: 1000px;
}

.file-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 16px;
	border-bottom: 1px solid #e5e7eb;
	background: #f9fafb;
}

.file-info {
	display: flex;
	align-items: center;
	gap: 8px;
}

.file-name {
	font-weight: 600;
	color: #111827;
}

.file-size-badge {
	font-size: 12px;
	color: #6b7280;
	background: #f3f4f6;
	padding: 2px 8px;
	border-radius: 4px;
}

.file-actions {
	display: flex;
	gap: 8px;
}

.file-content {
	flex: 1;
	overflow: auto;
	padding: 16px;
}

.code-preview {
	margin: 0;
	padding: 16px;
	background: #f6f8fa;
	border-radius: 6px;
	overflow-x: auto;
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", "Menlo", monospace;
	font-size: 14px;
	line-height: 1.6;
	font-feature-settings: "liga" 1, "calt" 1;
}

.code-preview code {
	background: transparent;
	padding: 0;
	border: none;
	color: #24292f;
}

.image-preview {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 32px;
}

.image-preview .el-image {
	max-width: 100%;
	max-height: 500px;
}

.file-too-large,
.binary-file {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	color: #6b7280;
}

.warning-icon,
.info-icon {
	font-size: 64px;
	margin-bottom: 16px;
	color: #f59e0b;
}

.info-icon {
	color: #3b82f6;
}
</style>
