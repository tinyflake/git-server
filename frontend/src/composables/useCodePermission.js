import { ref } from "vue"
import { ElMessage } from "element-plus"
import { repoApi } from "../api/repo.js"

export function useCodePermission() {
	const hasCodeViewPermission = ref(true)

	const checkCodeViewPermission = async (repoPath) => {
		try {
			const response = await repoApi.checkCodePermission(repoPath)
			if (response.code === 200) {
				hasCodeViewPermission.value = response.data.hasPermission
			} else {
				// 如果接口返回错误，默认没有权限
				hasCodeViewPermission.value = false
			}
		} catch (error) {
			console.error("检查代码查看权限失败:", error)
			// 出错时默认没有权限
			hasCodeViewPermission.value = false
		}
	}

	const contactAdmin = () => {
		ElMessage.info("请联系系统管理员开通代码查看权限")
	}

	return {
		hasCodeViewPermission,
		checkCodeViewPermission,
		contactAdmin,
	}
}
