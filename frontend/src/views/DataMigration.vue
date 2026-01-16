<template>
	<div class="data-migration-container">
		<el-card class="header-card">
			<template #header>
				<div class="card-header">
					<h2>
						<el-icon><Upload /></el-icon>
						数据迁移
					</h2>
					<el-tag type="danger" effect="dark">超级管理员专属</el-tag>
				</div>
			</template>
			<el-alert
				title="数据迁移说明"
				type="info"
				:closable="false"
				show-icon
			>
				<p>
					<strong>导出数据：</strong
					>将所有用户、仓库配置和仓库代码打包为 ZIP 文件下载
				</p>
				<p>
					<strong>导入数据：</strong
					>从备份文件恢复数据（会覆盖现有数据，请谨慎操作）
				</p>
				<p class="warning-text">
					⚠️
					导入数据会覆盖当前所有数据，包括用户账户（admin账户会被覆盖为备份中的密码）
				</p>
			</el-alert>
		</el-card>

		<!-- 数据统计 -->
		<el-card class="stats-card">
			<template #header>
				<h3>
					<el-icon><DataAnalysis /></el-icon> 当前数据统计
				</h3>
			</template>
			<el-row :gutter="20" v-loading="statsLoading">
				<el-col :span="6">
					<div class="stat-item">
						<div class="stat-icon user-icon">
							<el-icon><User /></el-icon>
						</div>
						<div class="stat-content">
							<div class="stat-value">{{ stats.userCount }}</div>
							<div class="stat-label">用户数</div>
						</div>
					</div>
				</el-col>
				<el-col :span="6">
					<div class="stat-item">
						<div class="stat-icon repo-icon">
							<el-icon><FolderOpened /></el-icon>
						</div>
						<div class="stat-content">
							<div class="stat-value">{{ stats.repoCount }}</div>
							<div class="stat-label">仓库数</div>
						</div>
					</div>
				</el-col>
				<el-col :span="6">
					<div class="stat-item">
						<div class="stat-icon size-icon">
							<el-icon><Files /></el-icon>
						</div>
						<div class="stat-content">
							<div class="stat-value">
								{{ formatSize(stats.totalSize) }}
							</div>
							<div class="stat-label">数据大小</div>
						</div>
					</div>
				</el-col>
				<el-col :span="6">
					<div class="stat-item">
						<div class="stat-icon zip-icon">
							<el-icon><Box /></el-icon>
						</div>
						<div class="stat-content">
							<div class="stat-value">
								{{ formatSize(stats.estimatedZipSize) }}
							</div>
							<div class="stat-label">预计压缩后</div>
						</div>
					</div>
				</el-col>
			</el-row>
		</el-card>

		<!-- 导出数据 -->
		<el-card class="export-card">
			<template #header>
				<h3>
					<el-icon><Download /></el-icon> 导出数据
				</h3>
			</template>
			<div class="export-content">
				<p>导出包含以下内容：</p>
				<ul>
					<li>✅ 所有用户账户和配置</li>
					<li>✅ 所有仓库配置和权限</li>
					<li>✅ 所有仓库代码和提交历史</li>
					<li>✅ 元数据信息（版本、导出时间等）</li>
				</ul>
				<el-button
					type="primary"
					size="large"
					:loading="exportLoading"
					:disabled="exportProgress > 0 && exportProgress < 100"
					@click="handleExport"
				>
					<el-icon><Download /></el-icon>
					{{ exportLoading ? "正在导出..." : "导出所有数据" }}
				</el-button>

				<!-- 导出进度 -->
				<div v-if="exportProgress > 0" class="progress-container">
					<el-progress
						:percentage="exportProgress"
						:status="
							exportStatus === 'error' ? 'exception' : undefined
						"
					/>
					<p class="progress-message">{{ exportMessage }}</p>
				</div>
			</div>
		</el-card>

		<!-- 导入数据 -->
		<el-card class="import-card">
			<template #header>
				<h3>
					<el-icon><Upload /></el-icon> 导入数据
				</h3>
			</template>
			<div class="import-content">
				<el-alert
					title="警告"
					type="warning"
					:closable="false"
					show-icon
					class="import-warning"
				>
					<p>导入数据将会：</p>
					<ul>
						<li>🔄 覆盖所有现有用户（包括 admin 账户）</li>
						<li>🔄 覆盖所有仓库配置和权限</li>
						<li>🔄 覆盖所有仓库代码</li>
						<li>⚠️ 此操作不可撤销，请确保已备份当前数据</li>
					</ul>
				</el-alert>

				<el-upload
					ref="uploadRef"
					class="upload-area"
					drag
					:auto-upload="false"
					:limit="1"
					accept=".zip"
					:on-change="handleFileChange"
					:on-exceed="handleExceed"
				>
					<el-icon class="el-icon--upload"><UploadFilled /></el-icon>
					<div class="el-upload__text">
						拖拽文件到此处或 <em>点击上传</em>
					</div>
					<template #tip>
						<div class="el-upload__tip">
							只支持 .zip 格式的备份文件
						</div>
					</template>
				</el-upload>

				<!-- 文件信息 -->
				<div v-if="selectedFile" class="file-info">
					<el-descriptions :column="2" border>
						<el-descriptions-item label="文件名">
							{{ selectedFile.name }}
						</el-descriptions-item>
						<el-descriptions-item label="文件大小">
							{{ formatSize(selectedFile.size) }}
						</el-descriptions-item>
					</el-descriptions>
				</div>

				<el-button
					type="danger"
					size="large"
					:loading="importLoading"
					:disabled="!selectedFile || importProgress > 0"
					@click="confirmImport"
				>
					<el-icon><Upload /></el-icon>
					{{ importLoading ? "正在导入..." : "开始导入" }}
				</el-button>

				<!-- 导入进度 -->
				<div v-if="importProgress > 0" class="progress-container">
					<el-progress
						:percentage="importProgress"
						:status="
							importStatus === 'error'
								? 'exception'
								: importStatus === 'completed'
								? 'success'
								: undefined
						"
					/>
					<p class="progress-message">{{ importMessage }}</p>
					<div v-if="importStats" class="import-stats">
						<el-tag>用户数: {{ importStats.userCount }}</el-tag>
						<el-tag type="success"
							>仓库数: {{ importStats.repoCount }}</el-tag
						>
						<el-tag type="info"
							>导出时间:
							{{ formatDate(importStats.exportTime) }}</el-tag
						>
					</div>
				</div>
			</div>
		</el-card>
	</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"
import { ElMessage, ElMessageBox, genFileId } from "element-plus"
import {
	Upload,
	Download,
	DataAnalysis,
	User,
	FolderOpened,
	Files,
	Box,
	UploadFilled,
} from "@element-plus/icons-vue"
import { migrationApi } from "../api/migration"
import { useRouter } from "vue-router"
import { authUtils } from "../api/auth"

const router = useRouter()

// 数据统计
const stats = ref({
	userCount: 0,
	repoCount: 0,
	totalSize: 0,
	estimatedZipSize: 0,
})
const statsLoading = ref(false)

// 导出相关
const exportLoading = ref(false)
const exportProgress = ref(0)
const exportMessage = ref("")
const exportStatus = ref("")
const exportTaskId = ref("")
const exportTimer = ref(null)

// 导入相关
const importLoading = ref(false)
const importProgress = ref(0)
const importMessage = ref("")
const importStatus = ref("")
const importStats = ref(null)
const importTaskId = ref("")
const importTimer = ref(null)
const selectedFile = ref(null)
const uploadRef = ref(null)

// 加载数据统计
const loadStats = async () => {
	statsLoading.value = true
	try {
		const response = await migrationApi.getStats()
		if (response.code === 200) {
			stats.value = response.data
		}
	} catch (error) {
		console.error("加载统计信息失败:", error)
	} finally {
		statsLoading.value = false
	}
}

// 导出数据
const handleExport = async () => {
	try {
		exportLoading.value = true
		exportProgress.value = 0
		exportMessage.value = "准备导出..."
		exportStatus.value = "running"

		const response = await migrationApi.exportData()

		// 获取任务ID
		exportTaskId.value = response.headers["x-task-id"]

		// 开始轮询进度
		if (exportTaskId.value) {
			startExportProgressPolling()
		}

		// 触发下载
		const blob = new Blob([response.data], { type: "application/zip" })
		const url = window.URL.createObjectURL(blob)
		const link = document.createElement("a")
		link.href = url

		// 从响应头获取文件名
		const contentDisposition = response.headers["content-disposition"]
		let filename = "data-backup.zip"
		if (contentDisposition) {
			const matches = /filename="(.+)"/.exec(contentDisposition)
			if (matches && matches[1]) {
				filename = matches[1]
			}
		}

		link.download = filename
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		window.URL.revokeObjectURL(url)

		exportProgress.value = 100
		exportMessage.value = "导出完成"
		exportStatus.value = "completed"
		ElMessage.success("数据导出成功")
	} catch (error) {
		console.error("导出失败:", error)
		exportProgress.value = 0
		exportMessage.value = "导出失败"
		exportStatus.value = "error"
		ElMessage.error(error.response?.data?.msg || "导出失败")
	} finally {
		exportLoading.value = false
	}
}

// 开始轮询导出进度
const startExportProgressPolling = () => {
	if (exportTimer.value) {
		clearInterval(exportTimer.value)
	}

	exportTimer.value = setInterval(async () => {
		try {
			const response = await migrationApi.getExportProgress(
				exportTaskId.value
			)
			if (response.code === 200 && response.data) {
				exportProgress.value = response.data.progress
				exportMessage.value = response.data.message
				exportStatus.value = response.data.status

				// 如果完成或失败，停止轮询
				if (
					response.data.status === "completed" ||
					response.data.status === "error"
				) {
					clearInterval(exportTimer.value)
					exportTimer.value = null
				}
			}
		} catch (error) {
			console.error("获取导出进度失败:", error)
		}
	}, 1000)
}

// 文件选择
const handleFileChange = (file) => {
	selectedFile.value = file.raw
	importProgress.value = 0
	importMessage.value = ""
	importStats.value = null
}

// 文件超出限制
const handleExceed = (files) => {
	uploadRef.value.clearFiles()
	const file = files[0]
	file.uid = genFileId()
	uploadRef.value.handleStart(file)
	selectedFile.value = file
}

// 确认导入
const confirmImport = async () => {
	try {
		await ElMessageBox.confirm(
			"导入数据将覆盖所有现有数据，包括用户账户和仓库。此操作不可撤销，是否继续？",
			"确认导入",
			{
				confirmButtonText: "确认导入",
				cancelButtonText: "取消",
				type: "warning",
				dangerouslyUseHTMLString: true,
			}
		)

		await handleImport()
	} catch {
		// 用户取消
	}
}

// 导入数据
const handleImport = async () => {
	if (!selectedFile.value) {
		ElMessage.warning("请先选择备份文件")
		return
	}

	try {
		importLoading.value = true
		importProgress.value = 0
		importMessage.value = "准备导入..."
		importStatus.value = "running"
		importStats.value = null

		console.log("📤 开始上传文件:", selectedFile.value.name)
		console.log("📦 文件大小:", selectedFile.value.size, "bytes")

		const response = await migrationApi.importData(selectedFile.value)

		console.log("📥 服务器完整响应:", JSON.stringify(response, null, 2))

		// 检查响应结构
		if (!response) {
			throw new Error("服务器无响应")
		}

		if (!response.code) {
			console.error("❌ 响应格式错误，缺少 code 字段")
			throw new Error("服务器响应格式错误")
		}

		if (response.code !== 200) {
			console.error("❌ 服务器返回错误:", response.msg)
			throw new Error(response.msg || "导入失败")
		}

		if (!response.data || !response.data.taskId) {
			console.error("❌ 响应中缺少 taskId")
			throw new Error("服务器未返回任务ID")
		}

		importTaskId.value = response.data.taskId
		console.log("✅ 获取到任务ID:", importTaskId.value)

		// 开始轮询进度
		startImportProgressPolling()
	} catch (error) {
		console.error("❌ 导入失败:", error)
		console.error("错误类型:", error.constructor.name)
		console.error("错误消息:", error.message)
		if (error.response) {
			console.error("HTTP状态:", error.response.status)
			console.error("响应数据:", error.response.data)
		}

		importProgress.value = 0
		importMessage.value = "导入失败: " + error.message
		importStatus.value = "error"
		importLoading.value = false

		ElMessage.error(
			error.response?.data?.msg || error.message || "导入失败"
		)
	}
}

// 开始轮询导入进度
const startImportProgressPolling = () => {
	if (importTimer.value) {
		clearInterval(importTimer.value)
	}

	console.log("🔄 开始轮询导入进度，任务ID:", importTaskId.value)

	importTimer.value = setInterval(async () => {
		try {
			console.log("📊 查询进度:", importTaskId.value)
			const response = await migrationApi.getImportProgress(
				importTaskId.value
			)

			console.log("📥 进度响应:", response)

			if (response.code === 404) {
				console.warn("⚠️ 任务不存在，可能还未创建")
				return
			}

			if (response.code === 200 && response.data) {
				importProgress.value = response.data.progress
				importMessage.value = response.data.message
				importStatus.value = response.data.status

				if (response.data.stats) {
					importStats.value = response.data.stats
				}

				// 如果完成，停止轮询并提示
				if (response.data.status === "completed") {
					clearInterval(importTimer.value)
					importTimer.value = null
					importLoading.value = false

					ElMessageBox.alert(
						`数据导入成功！<br/>
						- 恢复了 ${response.data.stats.userCount} 个用户<br/>
						- 恢复了 ${response.data.stats.repoCount} 个仓库<br/>
						<br/>
						3 秒后将自动跳转到登录页，请使用备份中的账户密码登录。`,
						"导入完成",
						{
							confirmButtonText: "立即跳转",
							type: "success",
							dangerouslyUseHTMLString: true,
							callback: () => {
								authUtils.logout().then(() => {
									router.push("/login")
								})
							},
						}
					)
					// 3秒后自动跳转
					setTimeout(() => {
						authUtils.logout().then(() => {
							router.push("/login")
						})
					}, 3000)
				}

				// 如果失败，停止轮询
				if (response.data.status === "error") {
					clearInterval(importTimer.value)
					importTimer.value = null
					importLoading.value = false
					ElMessage.error(response.data.message)
				}
			}
		} catch (error) {
			console.error("获取导入进度失败:", error)
		}
	}, 1000)
}

// 格式化文件大小
const formatSize = (bytes) => {
	if (!bytes || bytes === 0) return "0 B"
	const k = 1024
	const sizes = ["B", "KB", "MB", "GB"]
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i]
}

// 格式化日期
const formatDate = (dateStr) => {
	if (!dateStr) return "-"
	const date = new Date(dateStr)
	return date.toLocaleString("zh-CN")
}

// 组件挂载
onMounted(() => {
	loadStats()
})

// 组件卸载时清理定时器
onUnmounted(() => {
	if (exportTimer.value) {
		clearInterval(exportTimer.value)
	}
	if (importTimer.value) {
		clearInterval(importTimer.value)
	}
})
</script>

<style scoped>
.data-migration-container {
	padding: 20px;
	max-width: 1200px;
	margin: 0 auto;
}

.header-card {
	margin-bottom: 20px;
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.card-header h2 {
	margin: 0;
	display: flex;
	align-items: center;
	gap: 10px;
	font-size: 20px;
}

.el-alert p {
	margin: 5px 0;
}

.warning-text {
	color: #e6a23c;
	font-weight: bold;
}

/* 统计卡片 */
.stats-card {
	margin-bottom: 20px;
}

.stats-card h3 {
	margin: 0;
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 16px;
}

.stat-item {
	display: flex;
	align-items: center;
	gap: 15px;
	padding: 20px;
	background: #f5f7fa;
	border-radius: 8px;
	transition: all 0.3s;
}

.stat-item:hover {
	transform: translateY(-2px);
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
	width: 50px;
	height: 50px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24px;
	color: white;
}

.user-icon {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.repo-icon {
	background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.size-icon {
	background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.zip-icon {
	background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content {
	flex: 1;
}

.stat-value {
	font-size: 28px;
	font-weight: bold;
	color: #303133;
	line-height: 1;
	margin-bottom: 5px;
}

.stat-label {
	font-size: 14px;
	color: #909399;
}

/* 导出卡片 */
.export-card,
.import-card {
	margin-bottom: 20px;
}

.export-card h3,
.import-card h3 {
	margin: 0;
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 16px;
}

.export-content,
.import-content {
	padding: 10px 0;
}

.export-content ul,
.import-content ul {
	margin: 15px 0;
	padding-left: 20px;
}

.export-content li,
.import-content li {
	margin: 8px 0;
	color: #606266;
}

.export-content .el-button,
.import-content .el-button {
	margin-top: 20px;
}

/* 进度条 */
.progress-container {
	margin-top: 20px;
	padding: 20px;
	background: #f5f7fa;
	border-radius: 8px;
}

.progress-message {
	margin-top: 10px;
	text-align: center;
	color: #606266;
	font-size: 14px;
}

.import-stats {
	margin-top: 15px;
	display: flex;
	gap: 10px;
	justify-content: center;
}

/* 导入警告 */
.import-warning {
	margin-bottom: 20px;
}

.import-warning ul {
	margin: 10px 0 0 0;
	padding-left: 20px;
}

.import-warning li {
	margin: 5px 0;
}

/* 上传区域 */
.upload-area {
	margin: 20px 0;
}

.file-info {
	margin: 20px 0;
}
</style>
