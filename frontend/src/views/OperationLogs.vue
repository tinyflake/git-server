<template>
	<div class="operation-logs">
		<el-card>
			<template #header>
				<div class="card-header">
					<div class="header-left">
						<el-button
							type="default"
							@click="$router.push('/')"
							class="back-button"
						>
							<el-icon><ArrowLeft /></el-icon>
							返回首页
						</el-button>
						<div class="header-title">
							<h2>操作日志</h2>
							<p class="header-desc">查看系统操作记录</p>
						</div>
					</div>
				</div>
			</template>

			<!-- 筛选条件 -->
			<el-form :inline="true" class="filter-form">
				<el-form-item label="操作人">
					<el-input
						v-model="filters.operator"
						placeholder="输入用户名"
						clearable
						style="width: 200px"
					/>
				</el-form-item>
				<el-form-item label="操作类型">
					<el-select
						v-model="filters.action"
						placeholder="选择操作类型"
						clearable
						style="width: 200px"
					>
						<el-option label="创建用户" value="create_user" />
						<el-option label="删除用户" value="delete_user" />
						<el-option label="修改用户信息" value="update_user" />
						<el-option label="修改角色" value="update_role" />
						<el-option label="重置密码" value="reset_password" />
						<el-option
							label="修改白名单"
							value="update_whitelist"
						/>
						<el-option
							label="修改代码查看权限"
							value="update_code_view_permission"
						/>
						<el-option label="创建仓库" value="create_repo" />
						<el-option label="删除仓库" value="delete_repo" />
						<el-option
							label="修改仓库路径"
							value="update_repo_path"
						/>
						<el-option label="更新系统配置" value="update_config" />
					</el-select>
				</el-form-item>
				<el-form-item label="目标">
					<el-input
						v-model="filters.target"
						placeholder="用户名或仓库名"
						clearable
						style="width: 200px"
					/>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" @click="loadLogs">查询</el-button>
					<el-button @click="resetFilters">重置</el-button>
				</el-form-item>
			</el-form>

			<!-- 日志表格 -->
			<el-table :data="logs" v-loading="loading" style="margin-top: 20px">
				<el-table-column prop="timestamp" label="时间" width="180">
					<template #default="{ row }">
						{{ formatTime(row.timestamp) }}
					</template>
				</el-table-column>
				<el-table-column prop="operator" label="操作人" width="120" />
				<el-table-column prop="action" label="操作类型" width="150">
					<template #default="{ row }">
						<el-tag :type="getActionType(row.action)">
							{{ getActionLabel(row.action) }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="target" label="目标" width="150" />
				<el-table-column prop="details" label="详情" />
			</el-table>

			<!-- 分页 -->
			<el-pagination
				v-if="logs.length > 0"
				style="margin-top: 20px; text-align: right"
				:current-page="currentPage"
				:page-size="pageSize"
				:page-sizes="[20, 50, 100]"
				:total="total"
				layout="total, sizes, prev, pager, next"
				@current-change="handlePageChange"
				@size-change="handleSizeChange"
			/>
		</el-card>
	</div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { ElMessage } from "element-plus"
import { ArrowLeft } from "@element-plus/icons-vue"
import { logsService } from "../api/logs"

const logs = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const filters = ref({
	operator: "",
	action: "",
	target: "",
})

// 格式化时间
const formatTime = (timestamp) => {
	const date = new Date(timestamp)
	return date.toLocaleString("zh-CN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	})
}

// 获取操作类型标签
const getActionLabel = (action) => {
	const labels = {
		create_user: "创建用户",
		delete_user: "删除用户",
		update_user: "修改用户信息",
		update_role: "修改角色",
		reset_password: "重置密码",
		update_whitelist: "修改白名单",
		update_code_view_permission: "修改代码查看权限",
		create_repo: "创建仓库",
		delete_repo: "删除仓库",
		update_repo_path: "修改仓库路径",
		update_config: "更新系统配置",
	}
	return labels[action] || action
}

// 获取操作类型颜色
const getActionType = (action) => {
	const types = {
		create_user: "success",
		delete_user: "danger",
		update_user: "info",
		update_role: "warning",
		reset_password: "warning",
		update_whitelist: "info",
		update_code_view_permission: "info",
		create_repo: "success",
		delete_repo: "danger",
		update_repo_path: "warning",
		update_config: "warning",
	}
	return types[action] || "info"
}

// 加载日志
const loadLogs = async () => {
	loading.value = true
	try {
		const params = {
			limit: pageSize.value,
			...filters.value,
		}

		// 移除空值
		Object.keys(params).forEach((key) => {
			if (!params[key]) delete params[key]
		})

		const response = await logsService.getLogs(params)
		logs.value = response.data || []
		total.value = logs.value.length
	} catch (error) {
		ElMessage.error("加载日志失败")
		console.error(error)
	} finally {
		loading.value = false
	}
}

// 重置筛选条件
const resetFilters = () => {
	filters.value = {
		operator: "",
		action: "",
		target: "",
	}
	loadLogs()
}

// 分页变更
const handlePageChange = (page) => {
	currentPage.value = page
	loadLogs()
}

// 每页容量变更
const handleSizeChange = (size) => {
	pageSize.value = size
	currentPage.value = 1
	loadLogs()
}

onMounted(() => {
	loadLogs()
})
</script>

<style scoped>
.operation-logs {
	max-width: 1400px;
	margin: 0 auto;
	padding: 32px 24px;
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.header-left {
	display: flex;
	align-items: center;
	gap: 16px;
	flex: 1;
}

.back-button {
	flex-shrink: 0;
}

.header-title {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.card-header h2 {
	margin: 0;
	font-size: 20px;
	font-weight: 600;
	line-height: 1.2;
}

.header-desc {
	margin: 0;
	color: #6b7280;
	font-size: 14px;
	line-height: 1.2;
}

.filter-form {
	padding: 20px;
	background: #f9fafb;
	border-radius: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
	.operation-logs {
		padding: 24px 16px;
	}

	.header-left {
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
	}

	.back-button {
		width: 100%;
	}
}
</style>
