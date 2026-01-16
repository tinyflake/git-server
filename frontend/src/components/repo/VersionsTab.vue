<template>
	<div class="versions-content" v-loading="versionsLoading">
		<div class="versions-header">
			<h3>版本历史</h3>
			<div v-if="currentVersion" class="current-version-info">
				<span class="current-label">当前查看版本：</span>
				<span class="current-version-tag">{{
					currentVersion.version
				}}</span>
				<span class="current-hash"
					>({{ currentVersion.shortHash }})</span
				>
			</div>
		</div>

		<div v-if="versions.length > 0" class="version-list">
			<div
				v-for="version in versions"
				:key="version.hash"
				class="version-item"
				:class="{
					active: currentVersion?.hash === version.hash,
				}"
			>
				<div class="version-main">
					<div class="version-header">
						<button
							class="version-number-btn"
							@click="switchToVersion(version)"
							:class="{
								active: currentVersion?.hash === version.hash,
							}"
						>
							{{ version.version }}
						</button>
						<div class="version-tags">
							<span
								v-if="version.isLatest"
								class="version-tag latest"
								>latest</span
							>
							<span class="version-tag hash">{{
								version.shortHash
							}}</span>
						</div>
					</div>

					<div class="version-details">
						<p class="commit-message">
							<span>message: </span>{{ version.message }}
						</p>
						<div class="version-meta">
							<span class="meta-item">
								<el-icon><User /></el-icon>
								{{ version.author }}
							</span>
							<span class="meta-item">
								<el-icon><Calendar /></el-icon>
								{{ formatDate(version.date) }}
							</span>
						</div>
					</div>
				</div>

				<div class="version-actions">
					<el-button
						size="small"
						type="primary"
						@click="switchToVersion(version)"
						:disabled="currentVersion?.hash === version.hash"
					>
						查看
					</el-button>
				</div>
			</div>
		</div>

		<div v-else-if="!versionsLoading" class="no-versions">
			<el-icon class="no-versions-icon"><Document /></el-icon>
			<p>暂无版本记录</p>
		</div>
	</div>
</template>

<script setup>
import { User, Calendar, Document } from "@element-plus/icons-vue"

defineProps({
	versionsLoading: Boolean,
	versions: Array,
	currentVersion: Object,
	switchToVersion: Function,
	formatDate: Function,
})
</script>

<style scoped>
.versions-content {
	padding: 0;
}

.versions-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
	padding-bottom: 16px;
	border-bottom: 1px solid #e5e7eb;
}

.versions-header h3 {
	margin: 0;
	font-size: 20px;
	color: #111827;
}

.current-version-info {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 14px;
}

.current-label {
	color: #6b7280;
}

.current-version-tag {
	background: #10b981;
	color: white;
	padding: 2px 8px;
	border-radius: 4px;
	font-weight: 500;
}

.current-hash {
	color: #6b7280;
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", monospace;
	font-size: 12px;
}

.version-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.version-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px 20px;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	transition: all 0.2s ease;
	background: white;
}

.version-item:hover {
	border-color: #10b981;
	box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
}

.version-item.active {
	border-color: #10b981;
	background: #f0fdf4;
}

.version-main {
	flex: 1;
	min-width: 0;
}

.version-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8px;
}

.version-number-btn {
	background: none;
	border: none;
	font-size: 16px;
	font-weight: 600;
	color: #10b981;
	cursor: pointer;
	padding: 4px 8px;
	border-radius: 4px;
	transition: all 0.2s ease;
}

.version-number-btn:hover {
	background: #f0fdf4;
	color: #059669;
}

.version-number-btn.active {
	background: #10b981;
	color: white;
}

.version-tags {
	display: flex;
	align-items: center;
	gap: 6px;
}

.version-tag {
	padding: 2px 6px;
	border-radius: 3px;
	font-size: 11px;
	font-weight: 500;
}

.version-tag.latest {
	background: #10b981;
	color: white;
}

.version-tag.hash {
	background: #f3f4f6;
	color: #6b7280;
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", monospace;
}

.version-details {
	margin-top: 8px;
}

.commit-message {
	margin: 0 0 8px 0;
	padding: 5px;
	color: #374151;
	font-size: 14px;
	line-height: 1.4;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.version-meta {
	display: flex;
	align-items: center;
	gap: 16px;
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

.version-actions {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-left: 16px;
}

.no-versions {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60px 20px;
	text-align: center;
}

.no-versions-icon {
	font-size: 48px;
	color: #d1d5db;
	margin-bottom: 16px;
}

.no-versions p {
	margin: 0;
	color: #6b7280;
	font-size: 16px;
}
</style>
