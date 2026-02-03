<template>
	<div class="npm-package-card" @click="$emit('view', package)">
		<div class="package-header">
			<div class="package-info">
				<div class="package-name">
					<el-icon class="package-icon"><Box /></el-icon>
					<h3>{{ package.name }}</h3>
				</div>
				<div class="package-version">
					<el-tag type="success" size="small">
						v{{ package.version }}
					</el-tag>
				</div>
			</div>
		</div>

		<div class="package-description">
			<p>{{ package.description || "暂无描述" }}</p>
		</div>

		<div class="package-meta">
			<div class="meta-item">
				<el-icon><User /></el-icon>
				<span>{{ package.author || "未知" }}</span>
			</div>
			<div class="meta-item">
				<el-icon><Calendar /></el-icon>
				<span>{{ formatTime(package.publishTime) }}</span>
			</div>
			<div class="meta-item">
				<el-icon><Document /></el-icon>
				<span>{{ package.license }}</span>
			</div>
		</div>

		<div class="package-actions" @click.stop>
			<el-button size="small" @click="copyInstallCommand">
				<el-icon><CopyDocument /></el-icon>
				复制安装命令
			</el-button>
			<el-button size="small" @click="$emit('view', package)">
				<el-icon><View /></el-icon>
				查看详情
			</el-button>
		</div>
	</div>
</template>

<script setup>
import { computed } from "vue"
import { ElMessage } from "element-plus"
import {
	Box,
	User,
	Calendar,
	Document,
	CopyDocument,
	View,
} from "@element-plus/icons-vue"

const props = defineProps({
	package: {
		type: Object,
		required: true,
	},
	currentUser: {
		type: Object,
		default: null,
	},
})

defineEmits(["view"])

// 格式化时间
const formatTime = (dateString) => {
	if (!dateString || dateString === "未知") return "未知"
	const date = new Date(dateString)
	if (isNaN(date.getTime())) return "未知"

	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")

	return `${year}-${month}-${day}`
}

// 复制安装命令
const copyInstallCommand = async () => {
	const command = `npm install ${props.package.name}`
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
</script>

<style scoped>
.npm-package-card {
	padding: 20px 24px;
	border-bottom: 1px solid #f3f4f6;
	cursor: pointer;
	transition: all 0.2s ease;
}

.npm-package-card:hover {
	background-color: #f9fafb;
}

.npm-package-card:last-child {
	border-bottom: none;
}

.package-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 12px;
}

.package-info {
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
}

.package-name {
	display: flex;
	align-items: center;
	gap: 8px;
}

.package-icon {
	color: #67c23a;
	font-size: 18px;
}

.package-name h3 {
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: #1f2937;
}

.package-version {
	flex-shrink: 0;
}

.package-description {
	margin-bottom: 16px;
}

.package-description p {
	margin: 0;
	color: #6b7280;
	font-size: 14px;
	line-height: 1.5;
}

.package-meta {
	display: flex;
	gap: 24px;
	margin-bottom: 16px;
	flex-wrap: wrap;
}

.meta-item {
	display: flex;
	align-items: center;
	gap: 4px;
	color: #9ca3af;
	font-size: 12px;
}

.meta-item .el-icon {
	font-size: 14px;
}

.package-actions {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
	.npm-package-card {
		padding: 16px;
	}

	.package-meta {
		gap: 16px;
	}

	.package-actions {
		flex-direction: column;
	}

	.package-actions .el-button {
		width: 100%;
		justify-content: center;
	}
}
</style>
