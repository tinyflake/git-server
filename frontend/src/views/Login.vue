<template>
	<div class="login-page">
		<div class="login-container">
			<div class="login-card">
				<div class="login-header">
					<div class="logo" @click="goHome">
						<el-icon><Box /></el-icon>
					</div>
					<h1 @click="goHome">私有仓库</h1>
					<p>请登录以继续</p>
				</div>

				<el-form
					ref="loginFormRef"
					:model="loginForm"
					:rules="loginRules"
					class="login-form"
					@submit.prevent="handleLogin"
				>
					<el-form-item prop="username">
						<el-input
							v-model="loginForm.username"
							placeholder="用户名"
							size="large"
							:prefix-icon="User"
						/>
					</el-form-item>

					<el-form-item prop="password">
						<el-input
							v-model="loginForm.password"
							type="password"
							placeholder="密码"
							size="large"
							:prefix-icon="Lock"
							show-password
							@keyup.enter="handleLogin"
						/>
					</el-form-item>

					<el-form-item>
						<el-button
							type="primary"
							size="large"
							:loading="loginLoading"
							@click="handleLogin"
							class="login-button"
						>
							登录
						</el-button>
					</el-form-item>
				</el-form>

				<!-- <div class="login-footer">
					<p>默认管理员账号：admin / 123456</p>
				</div> -->
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import { Box, User, Lock } from "@element-plus/icons-vue"
import { authUtils } from "../api/auth.js"

const router = useRouter()

// 响应式数据
const loginForm = ref({
	username: "",
	password: "",
})

const loginLoading = ref(false)
const loginFormRef = ref()

// 表单验证规则
const loginRules = {
	username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
	password: [{ required: true, message: "请输入密码", trigger: "blur" }],
}

const goHome = () => {
	// 在登录页点击logo/标题不做任何操作
	// 因为未登录用户无法访问首页，已登录用户会被自动重定向
}
// 处理登录
const handleLogin = async () => {
	if (!loginFormRef.value) return

	const valid = await loginFormRef.value.validate().catch(() => false)
	if (!valid) return

	loginLoading.value = true
	try {
		await authUtils.login(
			loginForm.value.username,
			loginForm.value.password
		)
		ElMessage.success("登录成功")

		// 跳转到首页
		const redirect = router.currentRoute.value.query.redirect || "/"
		router.push(redirect)
	} catch (error) {
		console.error("登录失败:", error)
		ElMessage.error(
			error.response?.data?.error || error.message || "登录失败"
		)
	} finally {
		loginLoading.value = false
	}
}

// 组件挂载时检查是否已登录
onMounted(() => {
	if (authUtils.isLoggedIn()) {
		router.push("/")
	}
})
</script>

<style scoped>
.login-page {
	min-height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px;
}

.login-container {
	width: 100%;
	max-width: 400px;
}

.login-card {
	background: white;
	border-radius: 16px;
	padding: 40px;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.login-header {
	text-align: center;
	margin-bottom: 32px;
}

.logo {
	width: 64px;
	height: 64px;
	background: #4b5563;
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 16px;
	color: white;
	font-size: 32px;
}

.login-header h1 {
	margin: 0 0 8px 0;
	font-size: 28px;
	font-weight: 600;
	color: #111827;
}

.login-header p {
	margin: 0;
	color: #6b7280;
	font-size: 16px;
}

.login-form {
	margin-bottom: 24px;
}

.login-form .el-form-item {
	margin-bottom: 20px;
}

.login-button {
	width: 100%;
	height: 48px;
	font-size: 16px;
	font-weight: 600;
}

.login-footer {
	text-align: center;
	padding-top: 20px;
	border-top: 1px solid #f3f4f6;
}

.login-footer p {
	margin: 0;
	color: #6b7280;
	font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 480px) {
	.login-card {
		padding: 24px;
	}

	.login-header h1 {
		font-size: 24px;
	}
}
</style>
