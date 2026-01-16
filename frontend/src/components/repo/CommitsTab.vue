<template>
	<div class="commits-content" v-loading="commitsLoading">
		<div class="commits-header">
			<h3>提交历史</h3>
			<el-select
				:model-value="commitsBranch"
				@update:model-value="$emit('update:commitsBranch', $event)"
				placeholder="选择分支"
				size="small"
				style="width: 150px"
				@change="loadCommits(true)"
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
		</div>

		<div v-if="commits.length > 0" class="commits-list">
			<div
				v-for="(commit, index) in commits"
				:key="commit.hash"
				class="commit-item"
			>
				<div class="commit-graph">
					<div class="commit-dot"></div>
					<div
						v-if="index < commits.length - 1"
						class="commit-line"
					></div>
				</div>

				<div class="commit-content">
					<div class="commit-header">
						<span class="commit-message">{{ commit.message }}</span>
						<div class="commit-tags">
							<el-tag
								v-for="branch in commit.branches"
								:key="branch"
								size="small"
								type="success"
								>{{ branch }}</el-tag
							>
							<el-tag
								v-for="tag in commit.tags"
								:key="tag"
								size="small"
								type="warning"
								>{{ tag }}</el-tag
							>
						</div>
					</div>

					<div class="commit-meta">
						<span class="commit-hash">{{ commit.shortHash }}</span>
						<span class="commit-author">
							<el-icon><User /></el-icon>
							{{ commit.author }}
						</span>
						<span class="commit-date">
							<el-icon><Calendar /></el-icon>
							{{ formatDate(commit.date) }}
						</span>
					</div>
				</div>
			</div>

			<!-- 加载更多 -->
			<div v-if="hasMoreCommits" class="load-more">
				<el-button @click="loadMoreCommits" :loading="loadingMore">
					加载更多
				</el-button>
			</div>
		</div>

		<div v-else-if="!commitsLoading" class="no-commits">
			<el-icon class="no-commits-icon"><Document /></el-icon>
			<p>暂无提交记录</p>
		</div>
	</div>
</template>

<script setup>
import { User, Calendar, Document } from "@element-plus/icons-vue"

defineProps({
	commitsLoading: Boolean,
	commits: Array,
	commitsBranch: String,
	branches: Array,
	hasMoreCommits: Boolean,
	loadingMore: Boolean,
	loadCommits: Function,
	loadMoreCommits: Function,
	formatDate: Function,
})

defineEmits(["update:commitsBranch"])
</script>

<style scoped>
.commits-content {
	padding: 0;
}

.commits-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
	padding-bottom: 16px;
	border-bottom: 1px solid #e5e7eb;
}

.commits-header h3 {
	margin: 0;
	font-size: 20px;
	color: #111827;
}

.commits-list {
	display: flex;
	flex-direction: column;
	gap: 0;
}

.commit-item {
	display: flex;
	gap: 16px;
	padding: 16px 0;
	border-bottom: 1px solid #f3f4f6;
}

.commit-item:last-child {
	border-bottom: none;
}

.commit-graph {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 20px;
	flex-shrink: 0;
}

.commit-dot {
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: #10b981;
	border: 2px solid #10b981;
	flex-shrink: 0;
}

.commit-line {
	width: 2px;
	flex: 1;
	background: #e5e7eb;
	margin-top: 4px;
}

.commit-content {
	flex: 1;
	min-width: 0;
}

.commit-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 8px;
	gap: 12px;
}

.commit-message {
	font-size: 15px;
	font-weight: 500;
	color: #111827;
	flex: 1;
	word-break: break-word;
}

.commit-tags {
	display: flex;
	gap: 6px;
	flex-wrap: wrap;
}

.commit-meta {
	display: flex;
	align-items: center;
	gap: 16px;
	font-size: 13px;
	color: #6b7280;
}

.commit-hash {
	font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
		"Monaco", monospace;
	background: #f3f4f6;
	padding: 2px 6px;
	border-radius: 3px;
	font-size: 12px;
}

.commit-author,
.commit-date {
	display: flex;
	align-items: center;
	gap: 4px;
}

.load-more {
	display: flex;
	justify-content: center;
	padding: 24px 0;
}

.no-commits {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60px 20px;
	text-align: center;
}

.no-commits-icon {
	font-size: 48px;
	color: #d1d5db;
	margin-bottom: 16px;
}

.no-commits p {
	margin: 0;
	color: #6b7280;
	font-size: 16px;
}
</style>
