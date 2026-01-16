import { ref } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { repoApi } from "../api/repo.js"

export function useRepoOperations(configForm, loadRepoList) {
	const createLoading = ref(false)
	const editLoading = ref(false)
	const newRepoInfo = ref({})

	const getGitUrl = (repoName) => {
		return `http://${configForm.value.serverIP}:${configForm.value.serverPort}/git/${repoName}.git`
	}

	const handleCreateRepo = async (formData) => {
		createLoading.value = true
		try {
			if (!formData.repoPath) {
				formData.repoPath = `${configForm.value.defaultRepoPath}/${formData.repoName}`
			}

			const response = await repoApi.createRepo(formData)
			if (response.code === 200) {
				ElMessage.success("仓库创建成功")

				newRepoInfo.value = {
					repoName: formData.repoName,
					repoPath: response.data?.repoPath || formData.repoPath,
					serverUrl:
						response.data?.gitUrl || getGitUrl(formData.repoName),
					isNewRepo: true,
				}

				loadRepoList()
				return true
			} else {
				ElMessage.error(response.msg || "创建失败")
				return false
			}
		} catch (error) {
			ElMessage.error("网络请求失败")
			console.error(error)
			return false
		} finally {
			createLoading.value = false
		}
	}

	const handleUpdatePath = async (formData) => {
		try {
			await ElMessageBox.confirm(
				"修改路径将复制仓库到新位置，确认继续？",
				"确认修改",
				{
					confirmButtonText: "确认",
					cancelButtonText: "取消",
					type: "warning",
				}
			)
		} catch {
			return false
		}

		editLoading.value = true
		try {
			const response = await repoApi.updateRepoPath({
				repoName: formData.repoName,
				newPath: formData.newPath,
			})

			if (response.code === 200) {
				ElMessage.success("路径修改成功")
				loadRepoList()
				return true
			} else {
				ElMessage.error(response.msg || "修改失败")
				return false
			}
		} catch (error) {
			ElMessage.error("网络请求失败")
			console.error(error)
			return false
		} finally {
			editLoading.value = false
		}
	}

	const showRepoGuide = (repo) => {
		const gitUrl = getGitUrl(repo.repoName)
		newRepoInfo.value = {
			repoName: repo.repoName,
			repoPath: repo.repoPath,
			serverUrl: gitUrl,
			isNewRepo: false,
		}
		return newRepoInfo.value
	}

	const copyInstallCommand = (packageName) => {
		const registryCommand = `npm config set registry http://${configForm.value.serverIP}:${configForm.value.serverPort}/`
		const installCommand = `npm install ${packageName}`
		const fullCommand = `${registryCommand}\n${installCommand}`
		copyToClipboard(fullCommand)
	}

	const downloadLatestVersion = async (repo) => {
		try {
			ElMessage.info("正在准备下载...")
			const result = await repoApi.downloadLatestVersion(
				repo.repoPath,
				repo.repoName
			)
			if (result.success) {
				ElMessage.success("下载已开始")
			} else {
				ElMessage.error(result.error || "下载失败")
			}
		} catch (error) {
			ElMessage.error("下载失败")
			console.error(error)
		}
	}

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

	const handleDeleteRepo = async (repoName) => {
		try {
			await ElMessageBox.confirm(
				`确定要删除仓库 "${repoName}" 吗？此操作不可恢复！`,
				"删除仓库",
				{
					confirmButtonText: "确认删除",
					cancelButtonText: "取消",
					type: "error",
					confirmButtonClass: "el-button--danger",
				}
			)
		} catch {
			return false
		}

		try {
			const response = await repoApi.deleteRepo(repoName)
			if (response.code === 200) {
				ElMessage.success("仓库删除成功")
				loadRepoList()
				return true
			} else {
				ElMessage.error(response.msg || "删除失败")
				return false
			}
		} catch (error) {
			ElMessage.error("网络请求失败")
			console.error(error)
			return false
		}
	}

	return {
		createLoading,
		editLoading,
		newRepoInfo,
		handleCreateRepo,
		handleUpdatePath,
		showRepoGuide,
		copyInstallCommand,
		downloadLatestVersion,
	}
}
