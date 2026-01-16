import { ref } from "vue"
import { ElMessage } from "element-plus"
import { repoApi } from "../api/repo.js"

export function useRepoInfo(repoName) {
	const repoInfo = ref(null)
	const loading = ref(false)

	const loadRepoInfo = async () => {
		loading.value = true
		try {
			const response = await repoApi.getRepoList()
			if (response.code === 200) {
				// 确保 response.data 是数组
				if (!Array.isArray(response.data)) {
					ElMessage.error("仓库数据格式错误")
					return
				}

				const repo = response.data.find(
					(r) => r.repoName === repoName.value
				)

				if (repo) {
					// 获取仓库状态
					try {
						const statusResponse = await repoApi.getRepoStatus(
							repo.repoPath
						)

						// 获取最新提交信息
						let commitInfo = null
						try {
							const commitResponse =
								await repoApi.getLatestCommit(repo.repoPath)
							if (commitResponse.code === 200) {
								commitInfo = commitResponse.data
							}
						} catch (commitError) {
							console.warn("获取提交信息失败:", commitError)
						}

						// 获取package.json信息
						let packageInfo = null
						try {
							const packageResponse =
								await repoApi.getPackageInfo(repo.repoPath)
							if (packageResponse.code === 200) {
								packageInfo = packageResponse.data
							}
						} catch (packageError) {
							console.warn(
								"获取package.json信息失败:",
								packageError
							)
						}

						repoInfo.value = {
							...repo,
							isBare:
								statusResponse.code === 200
									? statusResponse.data.isBare
									: false,
							exists:
								statusResponse.code === 200
									? statusResponse.data.exists
									: false,
							// 使用真实的package.json信息或后备数据
							version: packageInfo?.version || "未知",
							author:
								commitInfo?.author ||
								packageInfo?.author ||
								"Unknown",
							authorEmail: commitInfo?.email || "",
							license: packageInfo?.license || "MIT",
							downloads: 0, // 模拟数据
							lastModified:
								commitInfo?.date || new Date().toISOString(),
							lastCommitMessage: commitInfo?.message || "",
							lastCommitHash: commitInfo?.hash || "",
							keywords: packageInfo?.keywords || [],
						}
					} catch (error) {
						repoInfo.value = {
							...repo,
							isBare: false,
							exists: false,
							version: "未知",
							author: "Unknown",
							authorEmail: "",
							license: "MIT",
							downloads: 0,
							lastModified: new Date().toISOString(),
							lastCommitMessage: "",
							lastCommitHash: "",
							keywords: [],
						}
					}
				}
			} else {
				ElMessage.error("获取仓库信息失败")
			}
		} catch (error) {
			ElMessage.error("网络请求失败")
			console.error(error)
		} finally {
			loading.value = false
		}
	}

	return {
		repoInfo,
		loading,
		loadRepoInfo,
	}
}
