<template>
	<div class="top-header">
		<div class="header-container">
			<div class="header-left">
				<el-button type="default" @click="goBack" class="back-button">
					<el-icon><ArrowLeft /></el-icon>
					返回
				</el-button>
				<div class="repo-title">
					<el-icon class="repo-icon"><Box /></el-icon>
					<h1>{{ repoName }}</h1>
				</div>
			</div>
			<div class="header-right">
				<el-button type="primary" @click="$emit('show-guide')">
					<el-icon><Document /></el-icon>
					使用指南
				</el-button>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ArrowLeft, Box, Document } from "@element-plus/icons-vue"
import { useRouter } from "vue-router"

defineProps({
	repoName: {
		type: String,
		required: true,
	},
})

defineEmits(["show-guide"])

const router = useRouter()

const goBack = () => {
	router.push("/")
}
</script>

<style scoped>
.top-header {
	background: #ffffff;
	color: black;
	padding: 0;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-container {
	max-width: 1400px;
	margin: 0 auto;
	padding: 16px 24px;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.header-left {
	display: flex;
	align-items: center;
	gap: 16px;
}

.back-button {
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.2);
	color: white;
}

.back-button:hover {
	background: rgba(255, 255, 255, 0.2);
}

.repo-title {
	display: flex;
	align-items: center;
	gap: 12px;
}

.repo-icon {
	font-size: 28px;
}

.repo-title h1 {
	margin: 0;
	font-size: 24px;
	font-weight: 600;
}

.header-right {
	display: flex;
	gap: 12px;
}
</style>
