import { ref } from "vue"
import { useRouter } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import { authUtils } from "../api/auth.js"

export function useAuth() {
	const router = useRouter()
	const changePasswordLoading = ref(false)

	const handleChangePassword = async (formData) => {
		changePasswordLoading.value = true
		try {
			const response = await authUtils.changePassword(
				formData.oldPassword,
				formData.newPassword
			)

			if (response.code === 200) {
				ElMessage.success("密码修改成功，请重新登录")
				await authUtils.logout()
				router.push("/login")
				return true
			} else {
				ElMessage.error(response.msg || "密码修改失败")
				return false
			}
		} catch (error) {
			ElMessage.error("网络请求失败")
			console.error(error)
			return false
		} finally {
			changePasswordLoading.value = false
		}
	}

	const handleUserCommand = async (command) => {
		switch (command) {
			case "profile":
				ElMessage.info("个人信息功能开发中")
				break
			case "users":
				router.push("/users")
				break
			case "permissions":
				router.push("/permissions")
				break
			case "repos":
				router.push("/repos")
				break
			case "logs":
				router.push("/logs")
				break
			case "migration":
				router.push("/migration")
				break
			case "changePassword":
				return "changePassword"
			case "logout":
				try {
					await ElMessageBox.confirm("确认退出登录？", "提示", {
						confirmButtonText: "确认",
						cancelButtonText: "取消",
						type: "warning",
					})

					await authUtils.logout()
					ElMessage.success("已退出登录")
					router.push("/login")
				} catch {
					// 用户取消
				}
				break
		}
	}

	return {
		changePasswordLoading,
		handleChangePassword,
		handleUserCommand,
	}
}
