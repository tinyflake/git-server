<template>
	<el-dialog
		v-model="visible"
		title="系统配置"
		width="600px"
		@close="$emit('update:modelValue', false)"
	>
		<el-tabs type="border-card">
			<el-tab-pane label="包管理器配置">
				<div class="config-section">
					<h4>📦 包管理器配置</h4>
					<p class="config-desc">
						下面是配置 registry
						的详细说明，每个包管理器有不同的配置，展开查看了解更多细节。
					</p>

					<el-collapse>
						<el-collapse-item title="npm" name="npm">
							<div class="package-manager-config">
								<p>
									npm 是 Node.js
									的默认包管理器，配置方式如下：
								</p>
								<div class="command-list">
									<div class="command-item-config">
										<code
											>npm set registry http://{{
												config.serverIP
											}}:{{ config.serverPort }}/</code
										>
										<el-button
											size="small"
											@click="
												copyCommand(
													'npm set registry http://' +
														config.serverIP +
														':' +
														config.serverPort +
														'/'
												)
											"
											:icon="CopyDocument"
										/>
									</div>
								</div>
							</div>
						</el-collapse-item>

						<el-collapse-item title="yarn" name="yarn">
							<div class="package-manager-config">
								<div class="command-list">
									<div class="command-item-config">
										<code
											>yarn config set registry http://{{
												config.serverIP
											}}:{{ config.serverPort }}/</code
										>
										<el-button
											size="small"
											@click="
												copyCommand(
													'yarn config set registry http://' +
														config.serverIP +
														':' +
														config.serverPort +
														'/'
												)
											"
											:icon="CopyDocument"
										/>
									</div>
								</div>
							</div>
						</el-collapse-item>

						<el-collapse-item title="pnpm" name="pnpm">
							<div class="package-manager-config">
								<div class="command-list">
									<div class="command-item-config">
										<code
											>pnpm set registry http://{{
												config.serverIP
											}}:{{ config.serverPort }}/</code
										>
										<el-button
											size="small"
											@click="
												copyCommand(
													'pnpm set registry http://' +
														config.serverIP +
														':' +
														config.serverPort +
														'/'
												)
											"
											:icon="CopyDocument"
										/>
									</div>
								</div>
							</div>
						</el-collapse-item>
					</el-collapse>
				</div>
			</el-tab-pane>

			<el-tab-pane label="服务器配置">
				<div class="config-section">
					<h4>🔧 服务器配置</h4>
					<el-alert
						type="warning"
						:closable="false"
						style="margin-bottom: 20px"
					>
						<template #title>
							⚠️ 修改服务器IP或端口后需要重启服务器才能生效
						</template>
						<div style="font-size: 13px; margin-top: 8px">
							• 数据不会丢失，但服务会短暂中断<br />
							• 修改后请手动重启后端服务
						</div>
					</el-alert>

					<el-form :model="config" label-width="120px">
						<el-form-item label="服务器IP">
							<el-input
								v-model="config.serverIP"
								placeholder="请输入服务器IP地址"
							/>
							<div class="form-tip">当前服务器的IP地址或域名</div>
						</el-form-item>
						<el-form-item label="服务器端口">
							<el-input
								v-model="config.serverPort"
								placeholder="请输入服务器端口"
								type="number"
							/>
							<div class="form-tip">
								后端服务监听的端口号（默认: 9001）
							</div>
						</el-form-item>
						<el-form-item label="默认仓库路径">
							<el-input
								v-model="config.defaultRepoPath"
								placeholder="默认仓库存储路径"
								disabled
							/>
							<div class="form-tip warning-tip">
								🔒 此配置已锁定，不可修改，避免数据丢失风险
							</div>
						</el-form-item>
					</el-form>
				</div>
			</el-tab-pane>
		</el-tabs>

		<template #footer>
			<el-button @click="visible = false">取消</el-button>
			<el-button type="primary" @click="handleSave">保存配置</el-button>
		</template>
	</el-dialog>
</template>

<script setup>
import { computed } from "vue"
import { ElMessage } from "element-plus"
import { CopyDocument } from "@element-plus/icons-vue"

const props = defineProps({
	modelValue: Boolean,
	config: {
		type: Object,
		required: true,
	},
})

const emit = defineEmits(["update:modelValue", "save"])

const visible = computed({
	get: () => props.modelValue,
	set: (val) => emit("update:modelValue", val),
})

const copyCommand = async (text) => {
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

const handleSave = () => {
	emit("save")
	visible.value = false
}
</script>

<style scoped>
.config-section {
	padding: 20px;
}

.config-section h4 {
	margin: 0 0 15px 0;
	color: #10b981;
	font-size: 16px;
}

.config-desc {
	margin-bottom: 20px;
	color: #6b7280;
	font-size: 14px;
	line-height: 1.5;
}

.package-manager-config {
	padding: 15px 0;
}

.package-manager-config p {
	margin: 10px 0;
	font-size: 14px;
	color: #6b7280;
	line-height: 1.5;
}

.command-list {
	margin: 15px 0;
}

.command-item-config {
	display: flex;
	align-items: center;
	margin-bottom: 10px;
	padding: 10px 15px;
	background-color: #f8f9fa;
	border: 1px solid #e9ecef;
	border-radius: 6px;
	font-family: "Courier New", monospace;
}

.command-item-config code {
	flex: 1;
	background: none;
	border: none;
	font-size: 13px;
	color: #2c3e50;
	white-space: pre-line;
}

.command-item-config .el-button {
	margin-left: 15px;
	flex-shrink: 0;
}

.form-tip {
	font-size: 12px;
	color: #909399;
	margin-top: 4px;
	line-height: 1.5;
}

.warning-tip {
	color: #e6a23c;
	font-weight: 500;
}
</style>
