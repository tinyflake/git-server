<template>
	<div class="help-button-wrapper">
		<el-tooltip content="使用帮助" placement="left">
			<el-button
				class="help-button"
				type="primary"
				circle
				size="large"
				@click="showHelp"
			>
				<el-icon :size="24">
					<QuestionFilled />
				</el-icon>
			</el-button>
		</el-tooltip>

		<HelpDialog v-model="helpVisible" />
	</div>
</template>

<script setup>
import { ref } from "vue"
import { QuestionFilled } from "@element-plus/icons-vue"
import HelpDialog from "./HelpDialog.vue"

const helpVisible = ref(false)

const showHelp = () => {
	helpVisible.value = true
}
</script>

<style scoped>
.help-button-wrapper {
	position: fixed;
	right: 32px;
	bottom: 76px;
	z-index: 1000;
}

.help-button {
	width: 56px;
	height: 56px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	transition: all 0.3s ease;
}

.help-button:hover {
	transform: scale(1.1);
	box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.help-button:active {
	transform: scale(1.05);
}

/* 添加呼吸动画 */
@keyframes pulse {
	0%,
	100% {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
	50% {
		box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
	}
}

.help-button {
	animation: pulse 2s ease-in-out infinite;
}

.help-button:hover {
	animation: none;
}
</style>
