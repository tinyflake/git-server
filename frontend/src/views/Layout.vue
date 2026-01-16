<template>
	<div class="main-layout">
		<HeaderBar
			:current-user="currentUser"
			:is-admin="isAdmin"
			:is-super-admin="isSuperAdmin"
			@user-command="handleUserCommand"
			@create-repo="showCreateRepoDialog = true"
			@open-config="showConfigDialog = true"
			@go-home="goHome"
		/>

		<main class="main-content">
			<router-view />
		</main>

		<FooterBar />

		<!-- 帮助按钮 -->
		<HelpButton />

		<!-- 修改密码对话框 -->
		<ChangePasswordDialog
			v-model="showChangePasswordDialog"
			:loading="changePasswordLoading"
			@submit="handleChangePasswordSubmit"
		/>

		<!-- 创建仓库对话框 -->
		<CreateRepoDialog
			v-model="showCreateRepoDialog"
			:loading="createRepoLoading"
			@submit="handleCreateRepo"
		/>

		<!-- 配置对话框 -->
		<ConfigDialog
			v-model="showConfigDialog"
			:config="configForm"
			@save="handleSaveConfig"
		/>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import HeaderBar from "../components/HeaderBar.vue"
import FooterBar from "../components/FooterBar.vue"
import HelpButton from "../components/HelpButton.vue"
import ChangePasswordDialog from "../components/ChangePasswordDialog.vue"
import CreateRepoDialog from "../components/CreateRepoDialog.vue"
import ConfigDialog from "../components/ConfigDialog.vue"
import { useAuth } from "../composables/useAuth"
import { authUtils, authApiService } from "../api/auth"
import configManager from "../utils/config"
import { repoApi } from "../api/repo"

const router = useRouter()
const { handleUserCommand: handleAuthCommand } = useAuth()

const showChangePasswordDialog = ref(false)
const showCreateRepoDialog = ref(false)
const showConfigDialog = ref(false)
const createRepoLoading = ref(false)
const changePasswordLoading = ref(false)

const configForm = ref({
	serverIP: "",
	serverPort: "",
	defaultRepoPath: "",
})

const currentUser = computed(() => authUtils.getCurrentUser())
const isAdmin = computed(() => authUtils.isAdmin())
const isSuperAdmin = computed(() => authUtils.isSuperAdmin())

const handleUserCommand = async (command) => {
	if (command === "changePassword") {
		showChangePasswordDialog.value = true
	} else {
		await handleAuthCommand(command)
	}
}

const handleChangePasswordSubmit = async (formData) => {
	changePasswordLoading.value = true
	try {
		const response = await authApiService.changePassword({
			oldPassword: formData.oldPassword,
			newPassword: formData.newPassword,
		})

		if (response.code === 200) {
			ElMessage.success("密码修改成功，请重新登录")
			showChangePasswordDialog.value = false
			// 清除登录信息
			await authUtils.logout()
			// 跳转到登录页
			router.push("/login")
		} else {
			ElMessage.error(response.msg || "密码修改失败")
		}
	} catch (error) {
		ElMessage.error(error.response?.data?.error || "密码修改失败")
		console.error(error)
	} finally {
		changePasswordLoading.value = false
	}
}

const handleCreateRepo = async (formData) => {
	createRepoLoading.value = true
	try {
		const response = await repoApi.createRepo(formData)

		if (response.code === 200) {
			ElMessage.success("仓库创建成功")
			showCreateRepoDialog.value = false

			// 如果在首页，刷新仓库列表
			if (router.currentRoute.value.name === "Home") {
				router.go(0)
			}
		} else {
			ElMessage.error(response.msg || "创建失败")
		}
	} catch (error) {
		ElMessage.error(error.response?.data?.msg || "创建失败")
		console.error(error)
	} finally {
		createRepoLoading.value = false
	}
}

const goHome = () => {
	router.push("/")
}

const loadConfig = async () => {
	await configManager.fetchServerConfig()
	configForm.value = { ...configManager.getDisplayConfig() }

	const savedConfig = localStorage.getItem("gitServerConfig")
	if (savedConfig) {
		configForm.value = { ...configForm.value, ...JSON.parse(savedConfig) }
	}
}

const handleSaveConfig = async () => {
	try {
		const response = await repoApi.saveConfig(configForm.value)

		if (response.code === 200) {
			ElMessage.success(response.msg || "配置保存成功")
			// 同时保存到本地存储
			localStorage.setItem(
				"gitServerConfig",
				JSON.stringify(configForm.value)
			)
			configManager.updateConfig(configForm.value)
		} else {
			ElMessage.error(response.msg || "配置保存失败")
		}
	} catch (error) {
		ElMessage.error(error.response?.data?.msg || "配置保存失败")
		console.error(error)
	}
}

onMounted(() => {
	loadConfig()
})
</script>

<style scoped>
.main-layout {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	background-color: #f5f5f5;
}

.main-content {
	flex: 1;
	width: 100%;
}
</style>
