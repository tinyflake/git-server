<template>
	<el-dialog
		v-model="visible"
		:title="repoInfo.isNewRepo ? '🎉 仓库创建成功！' : '📖 Git 操作指南'"
		width="600px"
		:close-on-click-modal="false"
		@close="$emit('update:modelValue', false)"
	>
		<div class="bind-dialog-content">
			<el-alert
				:title="
					repoInfo.isNewRepo
						? '仓库已成功创建为裸仓库，现在可以进行绑定操作'
						: '以下是该仓库的详细操作指南'
				"
				:type="repoInfo.isNewRepo ? 'success' : 'info'"
				:closable="false"
				show-icon
			/>

			<div class="repo-info">
				<h4>📁 仓库信息</h4>
				<p><strong>仓库名称：</strong>{{ repoInfo.repoName }}</p>
				<p><strong>存储路径：</strong>{{ repoInfo.repoPath }}</p>
				<p><strong>仓库地址：</strong>{{ repoInfo.serverUrl }}</p>
			</div>

			<div class="bind-instructions">
				<h4>🔗 绑定操作指南</h4>

				<el-tabs type="border-card">
					<el-tab-pane label="新项目绑定">
						<div class="command-section">
							<p>如果你有一个新的本地项目，按以下步骤绑定：</p>
							<div class="command-item">
								<span class="step-number">1</span>
								<div class="command-content">
									<p>进入你的项目目录并初始化Git：</p>
									<div class="command-box">
										<span class="code-text">git init</span>
										<el-button
											size="small"
											@click="copyToClipboard('git init')"
											:icon="CopyDocument"
										/>
									</div>
								</div>
							</div>

							<div class="command-item">
								<span class="step-number">2</span>
								<div class="command-content">
									<p>添加远程仓库：</p>
									<div class="command-box">
										<span class="code-text"
											>git remote add origin
											{{ repoInfo.serverUrl }}</span
										>
										<el-button
											size="small"
											@click="
												copyToClipboard(
													'git remote add origin ' +
														repoInfo.serverUrl
												)
											"
											:icon="CopyDocument"
										/>
									</div>
								</div>
							</div>

							<div class="command-item">
								<span class="step-number">3</span>
								<div class="command-content">
									<p>添加文件并提交：</p>
									<div class="command-box">
										<span class="code-text">git add .</span>
										<el-button
											size="small"
											@click="
												copyToClipboard('git add .')
											"
											:icon="CopyDocument"
										/>
									</div>
									<div class="command-box">
										<span class="code-text"
											>git commit -m "Initial commit"</span
										>
										<el-button
											size="small"
											@click="
												copyToClipboard(
													'git commit -m &quot;Initial commit&quot;'
												)
											"
											:icon="CopyDocument"
										/>
									</div>
								</div>
							</div>

							<div class="command-item">
								<span class="step-number">4</span>
								<div class="command-content">
									<p>推送到远程仓库：</p>
									<div class="command-box">
										<span class="code-text"
											>git push -u origin main</span
										>
										<el-button
											size="small"
											@click="
												copyToClipboard(
													'git push -u origin main'
												)
											"
											:icon="CopyDocument"
										/>
									</div>
								</div>
							</div>
						</div>
					</el-tab-pane>

					<el-tab-pane label="克隆仓库">
						<div class="command-section">
							<p>其他开发者可以通过以下命令克隆仓库：</p>
							<div class="command-item">
								<span class="step-number">1</span>
								<div class="command-content">
									<p>克隆仓库到本地：</p>
									<div class="command-box">
										<span class="code-text"
											>git clone {{ repoInfo.serverUrl }}</span
										>
										<el-button
											size="small"
											@click="
												copyToClipboard(
													'git clone ' +
														repoInfo.serverUrl
												)
											"
											:icon="CopyDocument"
										/>
									</div>
								</div>
							</div>
						</div>
					</el-tab-pane>
				</el-tabs>
			</div>
		</div>

		<template #footer>
			<el-button type="primary" @click="visible = false">
				<el-icon><Check /></el-icon>
				我知道了
			</el-button>
		</template>
	</el-dialog>
</template>

<script setup>
import { computed } from "vue"
import { ElMessage } from "element-plus"
import { CopyDocument, Check } from "@element-plus/icons-vue"

const props = defineProps({
	modelValue: Boolean,
	repoInfo: {
		type: Object,
		default: () => ({}),
	},
})

const emit = defineEmits(["update:modelValue"])

const visible = computed({
	get: () => props.modelValue,
	set: (val) => emit("update:modelValue", val),
})

const copyToClipboard = async (text) => {
	try {
		await navigator.clipboard.writeText(text)
		ElMessage.success("已复制到剪贴板")
	} catch (error) {
		const textArea = document.createElement("textarea")
		textArea.value = text
		document.body.appendChild(textArea)
		textArea.select()
		document.execCommand("copy")
		document.body.removeChild(textArea)
		ElMessage.success("已复制到剪贴板")
	}
}
</script>

<style scoped>
.bind-dialog-content {
	padding: 10px 0;
}

.repo-info {
	margin: 20px 0;
	padding: 15px;
	background-color: #f8f9fa;
	border-radius: 6px;
}

.repo-info h4 {
	margin: 0 0 10px 0;
	color: #10b981;
}

.repo-info p {
	margin: 5px 0;
	font-size: 14px;
}

.bind-instructions {
	margin-top: 20px;
}

.bind-instructions h4 {
	margin: 0 0 15px 0;
	color: #10b981;
}

.command-section {
	padding: 15px;
}

.command-item {
	display: flex;
	margin-bottom: 20px;
	align-items: flex-start;
}

.step-number {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	background-color: #10b981;
	color: white;
	border-radius: 50%;
	font-size: 12px;
	font-weight: bold;
	margin-right: 15px;
	flex-shrink: 0;
	margin-top: 2px;
}

.command-content {
	flex: 1;
}

.command-content p {
	margin: 0 0 10px 0;
	font-size: 14px;
	color: #6b7280;
}

.command-box {
	display: flex;
	align-items: center;
	margin-bottom: 8px;
	padding: 8px 12px;
	background-color: #f5f7fa;
	border: 1px solid #e4e7ed;
	border-radius: 4px;
	font-family: "Courier New", monospace;
}

.command-box .code-text {
	flex: 1;
	background: none;
	border: none;
	font-size: 13px;
	color: #2c3e50;
}

.command-box .el-button {
	margin-left: 10px;
}
</style>
