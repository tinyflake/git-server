<template>
	<div class="package-item" @click="$emit('click')">
		<div class="package-main">
			<div class="package-header">
				<h3 class="package-name">{{ repo.repoName }}</h3>
				<span class="package-version">{{
					repo.version || "1.0.0"
				}}</span>
			</div>

			<p class="package-description">{{ repo.desc || "暂无描述" }}</p>

			<div class="package-meta">
				<span class="meta-item">
					<el-icon><User /></el-icon>
					{{ repo.author || "Unknown" }}
				</span>
				<span class="meta-item">
					<el-icon><Calendar /></el-icon>
					{{ formatDate(repo.lastModified) }}
				</span>
				<span class="meta-item creator">
					<el-icon><UserFilled /></el-icon>
					创建者: {{ repo.creator || "未知" }}
				</span>
				<span class="meta-item license">{{
					repo.license || "MIT"
				}}</span>
			</div>

			<div
				class="package-keywords"
				v-if="repo.keywords && repo.keywords.length"
			>
				<span
					v-for="keyword in repo.keywords.slice(0, 4)"
					:key="keyword"
					class="keyword-tag"
				>
					{{ keyword }}
				</span>
			</div>
		</div>

		<div class="package-actions">
			<el-button
				size="small"
				type="primary"
				@click.stop="$emit('download-latest', repo)"
			>
				<el-icon><Download /></el-icon>
			</el-button>
			<el-button
				v-if="canDelete"
				size="small"
				type="danger"
				@click.stop="$emit('delete', repo)"
			>
				<el-icon><Delete /></el-icon>
			</el-button>
			<el-button size="small">
				<el-icon><MoreFilled /></el-icon>
			</el-button>
		</div>
	</div>
</template>

<script setup>
import { computed } from "vue"
import {
	User,
	UserFilled,
	Calendar,
	Download,
	MoreFilled,
	Delete,
} from "@element-plus/icons-vue"

const props = defineProps({
	repo: {
		type: Object,
		required: true,
	},
	currentUser: {
		type: Object,
		default: null,
	},
})

defineEmits([
	"click",
	"copy-install",
	"download-latest",
	"edit-path",
	"show-guide",
	"delete",
])

// 判断是否可以删除
const canDelete = computed(() => {
	if (!props.currentUser) return false

	// 超管可以删除所有仓库
	if (props.currentUser.role === "super_admin") return true

	// 管理员只能删除自己创建的仓库
	if (props.currentUser.role === "admin") {
		return props.repo.creator === props.currentUser.username
	}

	return false
})

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
</script>

<style scoped>
.package-item {
	display: flex;
	align-items: center;
	padding: 20px 24px;
	border-bottom: 1px solid #f3f4f6;
	cursor: pointer;
	transition: background-color 0.2s ease;
}

.package-item:hover {
	background-color: #f9fafb;
}

.package-item:last-child {
	border-bottom: none;
}

.package-main {
	flex: 1;
	min-width: 0;
}

.package-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8px;
}

.package-name {
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: #111827;
	text-decoration: none;
}

.package-name:hover {
	color: #10b981;
}

.package-version {
	background: #f3f4f6;
	color: #6b7280;
	padding: 2px 8px;
	border-radius: 4px;
	font-size: 12px;
	font-family: "Courier New", monospace;
	font-weight: 500;
}

.package-description {
	margin: 0 0 12px 0;
	color: #6b7280;
	font-size: 14px;
	line-height: 1.5;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.package-meta {
	display: flex;
	align-items: center;
	gap: 16px;
	margin-bottom: 8px;
	flex-wrap: wrap;
}

.meta-item {
	display: flex;
	align-items: center;
	gap: 4px;
	color: #6b7280;
	font-size: 12px;
}

.meta-item .el-icon {
	font-size: 14px;
}

.meta-item.creator {
	background: #fef3c7;
	color: #92400e;
	padding: 2px 6px;
	border-radius: 3px;
	font-weight: 500;
}

.meta-item.license {
	background: #f0f9ff;
	color: #0369a1;
	padding: 2px 6px;
	border-radius: 3px;
	font-weight: 500;
}

.package-keywords {
	display: flex;
	align-items: center;
	gap: 6px;
	flex-wrap: wrap;
}

.keyword-tag {
	background: #f3f4f6;
	color: #374151;
	padding: 2px 6px;
	border-radius: 3px;
	font-size: 11px;
	font-weight: 500;
}

.package-actions {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-left: 16px;
}

.package-actions .el-button {
	min-width: 36px;
	height: 36px;
	padding: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.package-actions .el-button--primary {
	background: #10b981;
	border-color: #10b981;
}

.package-actions .el-button--primary:hover {
	background: #059669;
	border-color: #059669;
}

.package-actions .el-button--danger {
	background: #ef4444;
	border-color: #ef4444;
}

.package-actions .el-button--danger:hover {
	background: #dc2626;
	border-color: #dc2626;
}

@media (max-width: 768px) {
	.package-item {
		flex-direction: column;
		align-items: flex-start;
		gap: 16px;
	}

	.package-actions {
		margin-left: 0;
		width: 100%;
		justify-content: flex-end;
	}

	.package-meta {
		flex-wrap: wrap;
	}
}
</style>
